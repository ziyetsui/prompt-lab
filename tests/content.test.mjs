import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { validateJsonSchema } from '../lib/json-schema.mjs'
import { buildRepository, repositoryRoot, validateRepository } from '../scripts/content.mjs'

async function tree(directory) {
  const result = {}
  for (const name of (await readdir(directory)).sort()) result[name] = await readFile(path.join(directory, name), 'utf8')
  return result
}

const REVISION = `sha256:${'1'.repeat(64)}`
const SOURCE_URL = 'https://example.invalid/promptlab-test-fixture'

function promptFixture(overrides = {}) {
  return {
    schemaVersion: 1,
    id: 'prm_contract_fixture',
    type: 'prompt',
    locale: 'en',
    sourceLocale: 'en',
    slug: 'contract-fixture-prompt',
    title: 'Contract fixture prompt',
    summary: 'Test-only canonical Prompt record generated inside a temporary directory and never published.',
    status: 'draft',
    indexable: false,
    contentType: 'text',
    models: ['fixture-model'],
    useCases: ['contract-testing'],
    techniques: ['variable-template'],
    styles: ['concise'],
    subjects: ['repository-fixture'],
    prompt: {
      language: 'en',
      text: 'Write a clearly labeled test-only response about [TOPIC], avoid factual claims, and state that the output exists solely to verify a repository contract.',
      variables: [{ key: '[TOPIC]', label: 'Test topic', required: true, defaultValue: null, options: [] }],
    },
    outcome: {
      outputType: 'text',
      purpose: 'Exercise the canonical Prompt contract in a temporary test directory.',
      platforms: ['generic-editor'],
      characteristics: ['test-only output'],
    },
    media: [],
    metrics: { likes: null, bookmarks: null, comments: null, reposts: null, views: null, observedAt: '2026-01-01T00:00:00Z' },
    inputs: { required: ['One test topic'], optional: [] },
    parameters: [{ key: 'TOPIC', label: 'Test topic', type: 'text', required: true, options: [] }],
    examples: [],
    workflow: [
      { position: 1, title: 'Choose a topic', body: 'Use non-sensitive fixture text only.' },
      { position: 2, title: 'Run the fixture', body: 'Confirm the output is labeled test-only.' },
    ],
    creator: null,
    relatedPromptIds: [],
    actions: { canCopy: true, tryUrl: null },
    source: {
      platform: 'manual',
      sourceId: 'promptlab-test-fixture',
      url: SOURCE_URL,
      authorHandle: null,
      publishedDate: '2026-01-01',
      observedAt: '2026-01-01T00:00:00Z',
    },
    evidence: [{ type: 'test-fixture', url: SOURCE_URL, confidence: null }],
    seo: {
      title: 'Canonical Prompt contract fixture',
      description: 'Test-only canonical fixture generated in a temporary directory and excluded from public repository content.',
      canonical: 'https://example.invalid/en/prompts/contract-fixture-prompt',
      robots: 'noindex,nofollow',
    },
    publication: { publishedAt: null, updatedAt: '2026-01-01T00:00:00Z', sourceRevision: REVISION },
    translation: { status: 'draft', translatedFromRevision: null, reviewer: null },
    ...overrides,
  }
}

function taxonomyFixture(axis) {
  const model = axis === 'model'
  return {
    schemaVersion: 1,
    id: model ? 'mdl_fixture_model' : 'cty_text',
    type: 'taxonomy',
    axis,
    locale: 'en',
    sourceLocale: 'en',
    slug: model ? 'fixture-model' : 'text',
    name: model ? 'Fixture model' : 'Text',
    description: 'Test-only taxonomy record generated inside a temporary test directory.',
    status: 'draft',
    indexable: false,
    selector: { field: model ? 'models' : 'contentType', value: model ? 'fixture-model' : 'text' },
    surface: {
      level: model ? 'L3' : 'L2',
      kind: model ? 'model-detail' : 'content-type-gallery',
      path: model ? '/en/prompts/models/fixture-model' : '/en/prompts/text',
    },
    model: model ? { officialUrl: null, capabilities: [], inputs: [], outputs: [], limitations: [] } : null,
    sourceRef: `docs/wireframes/flow-proto.html#${model ? 'l3' : 'l2'}`,
    seo: {
      title: model ? 'Fixture model prompts' : 'Text prompts fixture',
      description: 'Test-only taxonomy record generated inside a temporary test directory.',
      canonical: model ? 'https://example.invalid/en/prompts/models/fixture-model' : 'https://example.invalid/en/prompts/text',
      robots: 'noindex,nofollow',
    },
    publication: { publishedAt: null, updatedAt: '2026-01-01T00:00:00Z', sourceRevision: REVISION },
    translation: { status: 'draft', translatedFromRevision: null, reviewer: null },
  }
}

async function fixtureRepository({ omitModelTaxonomy = false, prompt = promptFixture(), taxonomyOverrides = {} } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'promptlab-fixture-'))
  await cp(path.join(repositoryRoot, 'schemas'), path.join(root, 'schemas'), { recursive: true })
  await mkdir(path.join(root, 'governance'), { recursive: true })
  await writeFile(path.join(root, 'governance', 'rights-clearances.json'), '{\n  "schemaVersion": 1,\n  "clearances": []\n}\n')
  const promptRoot = path.join(root, 'content', 'prompts', prompt.id)
  await mkdir(promptRoot, { recursive: true })
  const body = `# ${prompt.title}\n\n\`\`\`prompt\n${prompt.prompt.text}\n\`\`\`\n`
  await writeFile(path.join(promptRoot, `${prompt.locale}.md`), `---\n${JSON.stringify(prompt, null, 2)}\n---\n\n${body}`)
  for (const axis of omitModelTaxonomy ? ['content-type'] : ['content-type', 'model']) {
    const taxonomy = { ...taxonomyFixture(axis), ...(taxonomyOverrides[axis] ?? {}) }
    const directory = path.join(root, 'content', 'taxonomies', axis, taxonomy.id)
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, 'en.json'), `${JSON.stringify(taxonomy, null, 2)}\n`)
  }
  return root
}

test('empty bootstrap repository passes canonical Prompt-only validation', async () => {
  const result = await validateRepository(repositoryRoot)
  assert.deepEqual(result.diagnostics, [])
  assert.equal(result.documents.length, 0)
  assert.equal(result.taxonomies.length, 0)
})

test('taxonomy sourceRef accepts only legacy wireframes or this repository rights-evidence issues', async () => {
  const schema = JSON.parse(await readFile(path.join(repositoryRoot, 'schemas/taxonomy.schema.json'), 'utf8'))
  const sourceRefSchema = schema.properties.sourceRef
  for (const value of [
    'docs/wireframes/flow-proto.html#l2',
    'docs/wireframes/flow-proto.html#l3',
    'https://github.com/ziyetsui/prompt-lab/issues/1',
    'https://github.com/ziyetsui/prompt-lab/issues/987654',
  ]) assert.deepEqual(validateJsonSchema(sourceRefSchema, value), [], value)

  for (const value of [
    'https://example.com/ziyetsui/prompt-lab/issues/1',
    'https://github.com/another-owner/prompt-lab/issues/1',
    'https://github.com/ziyetsui/another-repo/issues/1',
    'https://github.com/ziyetsui/prompt-lab/issues/0',
    'https://github.com/ziyetsui/prompt-lab/issues/01',
    'https://github.com/ziyetsui/prompt-lab/issues/1?draft=true',
  ]) assert.ok(validateJsonSchema(sourceRefSchema, value).some((error) => error.keyword === 'pattern'), value)
})

test('build is deterministic and does not publish placeholder content', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'promptlab-build-'))
  const first = path.join(temporary, 'first')
  const second = path.join(temporary, 'second')
  await buildRepository(repositoryRoot, first)
  await buildRepository(repositoryRoot, second)
  assert.deepEqual(await tree(first), await tree(second))
  const catalog = JSON.parse(await readFile(path.join(first, 'catalog.json'), 'utf8'))
  assert.equal(catalog.promptCount, 0)
  assert.deepEqual(catalog.prompts, [])
})

test('temporary canonical draft Prompt and taxonomies allow null publishedAt', async () => {
  const root = await fixtureRepository()
  const result = await validateRepository(root)
  assert.deepEqual(result.diagnostics, [])
  assert.equal(result.documents.length, 1)
  assert.equal(result.taxonomies.length, 2)
  assert.equal(result.documents[0].frontmatter.publication.publishedAt, null)
  assert(result.taxonomies.every((record) => record.value.publication.publishedAt === null))
})

test('published Prompt still requires a real publication timestamp', async () => {
  const prompt = promptFixture({
    status: 'published',
    translation: { status: 'ready', translatedFromRevision: null, reviewer: 'human-reviewer' },
  })
  const root = await fixtureRepository({ prompt })
  const result = await validateRepository(root)
  assert(result.diagnostics.some((item) => item.includes('published content requires a real publication timestamp')))
})

test('published taxonomy still requires a real publication timestamp', async () => {
  const model = taxonomyFixture('model')
  const root = await fixtureRepository({
    taxonomyOverrides: {
      model: {
        status: 'published',
        translation: { status: 'ready', translatedFromRevision: null, reviewer: 'human-reviewer' },
        publication: { ...model.publication, publishedAt: null },
      },
    },
  })
  const result = await validateRepository(root)
  assert(result.diagnostics.some((item) => item.includes('published taxonomy requires a real publication timestamp')))
})

test('canonical schema rejects a missing required Prompt field', async () => {
  const prompt = promptFixture()
  delete prompt.summary
  const root = await fixtureRepository({ prompt })
  const result = await validateRepository(root)
  assert(result.diagnostics.some((item) => item.includes('schema:required') && item.includes('summary')))
})

test('canonical schema rejects missing provenance', async () => {
  const prompt = promptFixture()
  delete prompt.source
  const root = await fixtureRepository({ prompt })
  const result = await validateRepository(root)
  assert(result.diagnostics.some((item) => item.includes('schema:required') && item.includes('source')))
  assert(result.diagnostics.some((item) => item.includes('evidence must include the canonical source URL')))
})

test('relationship validation rejects a missing exact-locale taxonomy', async () => {
  const root = await fixtureRepository({ omitModelTaxonomy: true })
  const result = await validateRepository(root)
  assert(result.diagnostics.some((item) => item.includes('missing en model taxonomy for fixture-model')))
})

test('published indexable Prompt fails closed without human-approved content-rights clearance', async () => {
  const prompt = promptFixture({
    status: 'published',
    indexable: true,
    seo: { ...promptFixture().seo, robots: 'index,follow' },
    publication: { ...promptFixture().publication, publishedAt: '2026-01-01T00:00:00Z' },
    translation: { status: 'ready', translatedFromRevision: null, reviewer: 'human-reviewer' },
  })
  const root = await fixtureRepository({ prompt })
  const result = await validateRepository(root)
  assert(result.diagnostics.some((item) => item.includes('requires an exact human-approved content-rights clearance')))
  await assert.rejects(buildRepository(root, path.join(root, 'dist')), /content-rights clearance/)
})
