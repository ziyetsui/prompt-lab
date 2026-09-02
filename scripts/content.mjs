#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateJsonSchema } from '../lib/json-schema.mjs'

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PROMPT_ROOT = path.join('content', 'prompts')
const TAXONOMY_ROOT = path.join('content', 'taxonomies')
const ALLOWED_TAXONOMY_AXES = new Set(['content-type', 'model'])
const TOKEN = /\[[A-Z][A-Z0-9_]{1,39}\]/g
const SECRET = /(?:sk-[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/
const UNSAFE = /(?:<\/?script\b|\bon[a-z]+\s*=|javascript:|data:text\/html)/i

function binaryCompare(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'))
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort(binaryCompare).map((key) => [key, stable(value[key])]))
  }
  return value
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`
}

async function exists(file) {
  try {
    await lstat(file)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

async function walk(directory) {
  if (!(await exists(directory))) return []
  const files = []
  const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) => binaryCompare(a.name, b.name))
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`symlink is forbidden: ${absolute}`)
    if (entry.isDirectory()) files.push(...await walk(absolute))
    else if (entry.isFile()) files.push(absolute)
    else throw new Error(`special filesystem entry is forbidden: ${absolute}`)
  }
  return files
}

async function readJson(file) {
  const source = await readFile(file, 'utf8')
  if (source.includes('\r')) throw new Error(`${file}: JSON must use LF line endings`)
  return { source, value: JSON.parse(source) }
}

export function parseMarkdown(source, file = '<memory>') {
  if (source.includes('\r')) throw new Error(`${file}: Markdown must use LF line endings`)
  if (!source.startsWith('---\n')) throw new Error(`${file}: Markdown must start with ---`)
  const closing = source.indexOf('\n---\n', 4)
  if (closing === -1) throw new Error(`${file}: closing frontmatter delimiter is missing`)
  const body = source.slice(closing + 5).trim()
  if (!body) throw new Error(`${file}: Markdown body must not be empty`)
  let frontmatter
  try {
    frontmatter = JSON.parse(source.slice(4, closing))
  } catch (error) {
    throw new Error(`${file}: frontmatter must be JSON-compatible YAML: ${error.message}`)
  }
  return { body, file, frontmatter, source }
}

function addSchemaDiagnostics(errors, file, diagnostics) {
  for (const error of errors) diagnostics.push(`${file}: schema:${error.keyword} ${error.path} ${error.message}`)
}

function validatePrompt(document, schema, root, diagnostics) {
  const data = document.frontmatter
  const relative = path.relative(root, document.file).split(path.sep)
  addSchemaDiagnostics(validateJsonSchema(schema, data), document.file, diagnostics)
  if (!data || typeof data !== 'object') return
  if (relative.length !== 4 || relative[0] !== 'content' || relative[1] !== 'prompts') {
    diagnostics.push(`${document.file}: prompt path must be content/prompts/<id>/<locale>.md`)
  } else {
    if (relative[2] !== data.id) diagnostics.push(`${document.file}: id must equal its immutable directory name`)
    if (path.basename(relative[3], '.md') !== data.locale) diagnostics.push(`${document.file}: locale must equal the filename`)
  }
  if (document.body.split('\n').find((line) => line.trim()) !== `# ${data.title}`) {
    diagnostics.push(`${document.file}: first body heading must exactly equal title`)
  }
  if (/<\/?[A-Za-z][^>]*>/.test(document.body)) diagnostics.push(`${document.file}: raw HTML is forbidden`)
  const fences = [...document.body.matchAll(/```prompt\n([\s\S]*?)\n```/g)]
  if (fences.length !== 1 || fences[0][1].trim() !== data.prompt?.text) {
    diagnostics.push(`${document.file}: exactly one prompt fence must equal prompt.text`)
  }
  const used = [...new Set(data.prompt?.text?.match(TOKEN) ?? [])].sort(binaryCompare)
  const declared = [...new Set((data.prompt?.variables ?? []).map((item) => item.key))].sort(binaryCompare)
  if (JSON.stringify(used) !== JSON.stringify(declared)) diagnostics.push(`${document.file}: declared variables must match prompt tokens`)
  const parameters = [...new Set((data.parameters ?? []).map((item) => `[${item.key}]`))].sort(binaryCompare)
  if (JSON.stringify(parameters) !== JSON.stringify(declared)) diagnostics.push(`${document.file}: parameters must cover prompt variables`)
  const positions = (data.workflow ?? []).map((item) => item.position)
  if (positions.some((value, index) => value !== index + 1)) diagnostics.push(`${document.file}: workflow positions must be contiguous from 1`)
  const publicRecord = data.status === 'published' && data.indexable === true
  if (publicRecord && (data.translation?.status !== 'ready' || !data.translation?.reviewer || data.seo?.robots !== 'index,follow')) {
    diagnostics.push(`${document.file}: indexable published content requires ready review and index,follow`)
  }
  if (!publicRecord && (data.indexable !== false || data.seo?.robots !== 'noindex,nofollow')) {
    diagnostics.push(`${document.file}: non-public content must be noindex and not indexable`)
  }
  if (!(data.evidence ?? []).some((item) => item.url === data.source?.url)) {
    diagnostics.push(`${document.file}: evidence must include the canonical source URL`)
  }
  if (SECRET.test(document.source) || UNSAFE.test(document.source)) diagnostics.push(`${document.file}: unsafe or secret-like content detected`)
}

function validateTaxonomy(record, schema, root, diagnostics) {
  const data = record.value
  const relative = path.relative(root, record.file).split(path.sep)
  addSchemaDiagnostics(validateJsonSchema(schema, data), record.file, diagnostics)
  if (!data || typeof data !== 'object') return
  if (relative.length !== 5 || relative[0] !== 'content' || relative[1] !== 'taxonomies') {
    diagnostics.push(`${record.file}: taxonomy path must be content/taxonomies/<axis>/<id>/<locale>.json`)
  } else if (relative[2] !== data.axis || relative[3] !== data.id || path.basename(relative[4], '.json') !== data.locale) {
    diagnostics.push(`${record.file}: taxonomy axis, id, and locale must match its path`)
  }
  if (!ALLOWED_TAXONOMY_AXES.has(data.axis)) diagnostics.push(`${record.file}: unsupported taxonomy axis ${data.axis}`)
  if (data.indexable !== false || data.seo?.robots !== 'noindex,nofollow') {
    diagnostics.push(`${record.file}: canonical Internal Beta taxonomy must be noindex and not indexable`)
  }
  if (SECRET.test(record.source) || UNSAFE.test(record.source)) diagnostics.push(`${record.file}: unsafe or secret-like content detected`)
}

function validateRelationships(documents, taxonomies, clearances, diagnostics) {
  const terms = new Set(taxonomies.map(({ value }) => `${value.locale}\0${value.axis}\0${value.slug}`))
  const ids = new Set(documents.map(({ frontmatter }) => frontmatter.id))
  const sourceLocales = new Set(documents.map(({ frontmatter }) => `${frontmatter.id}\0${frontmatter.locale}`))
  const unique = new Map()
  const clearanceByPrompt = new Map()
  for (const clearance of clearances) {
    const key = `${clearance.id}\0${clearance.locale}`
    if (clearanceByPrompt.has(key)) diagnostics.push(`governance/rights-clearances.json: duplicate clearance for ${clearance.id}/${clearance.locale}`)
    else clearanceByPrompt.set(key, clearance)
  }
  for (const document of documents) {
    const data = document.frontmatter
    for (const [axis, values] of [['content-type', [data.contentType]], ['model', data.models ?? []]]) {
      for (const value of values) {
        if (!terms.has(`${data.locale}\0${axis}\0${value}`)) diagnostics.push(`${document.file}: missing ${data.locale} ${axis} taxonomy for ${value}`)
      }
    }
    if (!sourceLocales.has(`${data.id}\0${data.sourceLocale}`)) diagnostics.push(`${document.file}: source locale file is missing`)
    if (publicPrompt(document) && !clearanceByPrompt.has(`${data.id}\0${data.locale}`)) {
      diagnostics.push(`${document.file}: published indexable content requires an exact human-approved content-rights clearance`)
    }
    for (const related of data.relatedPromptIds ?? []) if (!ids.has(related)) diagnostics.push(`${document.file}: related prompt ${related} is missing`)
    for (const [field, value] of [['slug', data.slug], ['title', data.title], ['seo.title', data.seo?.title]]) {
      const key = `${data.locale}\0${field}\0${value}`
      if (unique.has(key)) diagnostics.push(`${document.file}: ${field} conflicts with ${unique.get(key)}`)
      else unique.set(key, document.file)
    }
  }
  for (const clearance of clearances) {
    if (!sourceLocales.has(`${clearance.id}\0${clearance.locale}`)) {
      diagnostics.push(`governance/rights-clearances.json: clearance target ${clearance.id}/${clearance.locale} is missing`)
    }
  }
}

export async function validateRepository(root = repositoryRoot) {
  const diagnostics = []
  const schemaRoot = path.join(root, 'schemas')
  const contentSchema = (await readJson(path.join(schemaRoot, 'content.schema.json'))).value
  const taxonomySchema = (await readJson(path.join(schemaRoot, 'taxonomy.schema.json'))).value
  const rightsSchema = (await readJson(path.join(schemaRoot, 'rights-clearance.schema.json'))).value
  await readJson(path.join(schemaRoot, 'site.schema.json'))
  await readJson(path.join(schemaRoot, 'surfaces.schema.json'))
  const rightsFile = path.join(root, 'governance', 'rights-clearances.json')
  const rightsRecord = await readJson(rightsFile)
  addSchemaDiagnostics(validateJsonSchema(rightsSchema, rightsRecord.value), rightsFile, diagnostics)
  if (SECRET.test(rightsRecord.source) || UNSAFE.test(rightsRecord.source)) diagnostics.push(`${rightsFile}: unsafe or secret-like content detected`)

  const promptFiles = await walk(path.join(root, PROMPT_ROOT))
  const taxonomyFiles = await walk(path.join(root, TAXONOMY_ROOT))
  const documents = []
  const taxonomies = []
  for (const file of promptFiles) {
    if (path.extname(file) !== '.md') { diagnostics.push(`${file}: only Markdown prompt files are allowed`); continue }
    try {
      const document = parseMarkdown(await readFile(file, 'utf8'), file)
      documents.push(document)
      validatePrompt(document, contentSchema, root, diagnostics)
    } catch (error) { diagnostics.push(error.message) }
  }
  for (const file of taxonomyFiles) {
    if (path.extname(file) !== '.json') { diagnostics.push(`${file}: only JSON taxonomy files are allowed`); continue }
    try {
      const record = { ...(await readJson(file)), file }
      taxonomies.push(record)
      validateTaxonomy(record, taxonomySchema, root, diagnostics)
    } catch (error) { diagnostics.push(`${file}: ${error.message}`) }
  }
  const clearances = Array.isArray(rightsRecord.value?.clearances) ? rightsRecord.value.clearances : []
  validateRelationships(documents, taxonomies, clearances, diagnostics)
  diagnostics.sort(binaryCompare)
  return { clearances, diagnostics, documents, taxonomies }
}

function publicPrompt(document) {
  const data = document.frontmatter
  return data.status === 'published' && data.indexable === true && data.translation.status === 'ready' && data.seo.robots === 'index,follow'
}

function catalogRecord(document) {
  const data = document.frontmatter
  return {
    contentType: data.contentType,
    id: data.id,
    locale: data.locale,
    models: data.models,
    slug: data.slug,
    styles: data.styles,
    subjects: data.subjects,
    summary: data.summary,
    techniques: data.techniques,
    title: data.title,
    useCases: data.useCases,
  }
}

export async function buildRepository(root = repositoryRoot, output = path.join(root, 'dist')) {
  const validated = await validateRepository(root)
  if (validated.diagnostics.length) throw new Error(validated.diagnostics.join('\n'))
  const records = validated.documents.filter(publicPrompt).map(catalogRecord).sort((a, b) => binaryCompare(`${a.locale}/${a.id}`, `${b.locale}/${b.id}`))
  const classifications = {}
  for (const field of ['contentType', 'models', 'useCases', 'techniques', 'styles', 'subjects']) {
    const values = new Set()
    for (const record of records) {
      const current = Array.isArray(record[field]) ? record[field] : [record[field]]
      for (const value of current) values.add(value)
    }
    classifications[field] = [...values].sort(binaryCompare)
  }
  const catalog = { schemaVersion: 1, promptCount: records.length, prompts: records }
  const manifest = {
    schemaVersion: 1,
    contentRevision: `sha256:${createHash('sha256').update(stableJson(catalog)).digest('hex')}`,
    files: ['README.md', 'catalog.json', 'classifications.json'],
  }
  const markdown = [
    '# PromptLab catalog',
    '',
    `Validated public prompts: ${records.length}`,
    '',
    ...(records.length ? records.map((item) => `- **${item.title}** (\`${item.locale}\`, \`${item.id}\`)`) : ['No prompt currently passes all publication and indexing gates.']),
    '',
  ].join('\n')
  if (path.resolve(output) === path.resolve(root)) throw new Error('output must not be the repository root')
  await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })
  await writeFile(path.join(output, 'README.md'), markdown, 'utf8')
  await writeFile(path.join(output, 'catalog.json'), stableJson(catalog), 'utf8')
  await writeFile(path.join(output, 'classifications.json'), stableJson(classifications), 'utf8')
  await writeFile(path.join(output, 'manifest.json'), stableJson(manifest), 'utf8')
  return { manifest, output, promptCount: records.length }
}

async function main() {
  const command = process.argv[2]
  if (command === 'validate') {
    const result = await validateRepository()
    if (result.diagnostics.length) throw new Error(result.diagnostics.join('\n'))
    process.stdout.write(`VALID prompts=${result.documents.length} taxonomies=${result.taxonomies.length}\n`)
    return
  }
  if (command === 'build') {
    const index = process.argv.indexOf('--output')
    const output = index === -1 ? path.join(repositoryRoot, 'dist') : path.resolve(process.argv[index + 1])
    const result = await buildRepository(repositoryRoot, output)
    process.stdout.write(`BUILT public-prompts=${result.promptCount} revision=${result.manifest.contentRevision}\n`)
    return
  }
  throw new Error('command must be validate or build')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`INVALID ${error.message}\n`)
    process.exitCode = 1
  })
}
