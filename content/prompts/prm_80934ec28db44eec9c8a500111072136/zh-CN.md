---
{
  "actions": {
    "canCopy": true,
    "tryUrl": null
  },
  "contentType": "text",
  "creator": null,
  "evidence": [
    {
      "confidence": 1,
      "type": "owner-authorization",
      "url": "https://github.com/ziyetsui/prompt-lab/issues/1"
    }
  ],
  "examples": [],
  "id": "prm_80934ec28db44eec9c8a500111072136",
  "indexable": true,
  "inputs": {
    "optional": [],
    "required": [
      "目标",
      "现有条件",
      "截止时间",
      "限制条件"
    ]
  },
  "locale": "zh-CN",
  "media": [],
  "metrics": {
    "bookmarks": null,
    "comments": null,
    "likes": null,
    "observedAt": "2026-09-02T19:16:57.000Z",
    "reposts": null,
    "views": null
  },
  "models": [
    "model-agnostic"
  ],
  "outcome": {
    "characteristics": [
      "结构化",
      "可执行",
      "可验收"
    ],
    "outputType": "text",
    "platforms": [
      "chat-interface"
    ],
    "purpose": "生成可立即执行并可由人验收的最小目标计划。"
  },
  "parameters": [
    {
      "key": "GOAL",
      "label": "目标",
      "options": [],
      "required": true,
      "type": "text"
    },
    {
      "key": "CONTEXT",
      "label": "现有条件",
      "options": [],
      "required": true,
      "type": "text"
    },
    {
      "key": "DEADLINE",
      "label": "截止时间",
      "options": [],
      "required": true,
      "type": "text"
    },
    {
      "key": "CONSTRAINTS",
      "label": "限制条件",
      "options": [],
      "required": true,
      "type": "text"
    }
  ],
  "prompt": {
    "language": "zh-CN",
    "text": "你是一名执行规划助手。请把以下目标转化为可立即执行、可以验收的最小计划。\n\n目标：[GOAL]\n现有条件：[CONTEXT]\n截止时间：[DEADLINE]\n限制条件：[CONSTRAINTS]\n\n要求：\n1. 用一句话定义最终可验收结果。\n2. 只列出完成目标必需的步骤，并按依赖关系排序。\n3. 每一步写明输入、输出、预计时间和验收标准。\n4. 标出阻塞项、主要风险和必须由人决定的问题。\n5. 给出今天可以立即开始的前三项行动。\n6. 不得虚构事实；信息不足时明确标记“待确认”。\n\n请以 Markdown 输出，依次包含：目标、已知条件、关键假设、执行计划、风险、待确认问题、今日行动。",
    "variables": [
      {
        "defaultValue": null,
        "key": "[GOAL]",
        "label": "目标",
        "options": [],
        "required": true
      },
      {
        "defaultValue": null,
        "key": "[CONTEXT]",
        "label": "现有条件",
        "options": [],
        "required": true
      },
      {
        "defaultValue": null,
        "key": "[DEADLINE]",
        "label": "截止时间",
        "options": [],
        "required": true
      },
      {
        "defaultValue": null,
        "key": "[CONSTRAINTS]",
        "label": "限制条件",
        "options": [],
        "required": true
      }
    ]
  },
  "publication": {
    "publishedAt": "2026-09-03T11:41:28.915Z",
    "sourceRevision": "sha256:25b4842618bcc2d914a811d871536742b5e633c7b6823b47780bdfb191aca1f6",
    "updatedAt": "2026-09-03T11:41:28.915Z"
  },
  "relatedPromptIds": [],
  "schemaVersion": 1,
  "seo": {
    "canonical": "https://github.com/ziyetsui/prompt-lab/blob/main/content/prompts/prm_80934ec28db44eec9c8a500111072136/zh-CN.md",
    "description": "使用结构化 Prompt 把模糊目标拆成有依赖顺序、输入输出、时间估算、验收标准、风险与今日行动的最小计划。",
    "robots": "index,follow",
    "title": "把模糊目标转化为可执行计划｜PromptLab"
  },
  "slug": "turn-goal-into-action-plan",
  "source": {
    "authorHandle": "ziyetsui",
    "observedAt": "2026-09-02T19:16:57.000Z",
    "platform": "manual",
    "publishedDate": "2026-09-02",
    "sourceId": "promptlab-owner-approval-issue-1",
    "url": "https://github.com/ziyetsui/prompt-lab/issues/1"
  },
  "sourceLocale": "zh-CN",
  "status": "published",
  "styles": [
    "concise"
  ],
  "subjects": [
    "project-execution"
  ],
  "summary": "把尚未拆解的目标转化为按依赖排序、包含时间估算、验收标准、风险和今日行动的最小执行计划。",
  "techniques": [
    "structured-decomposition"
  ],
  "title": "把模糊目标转化为可执行计划",
  "translation": {
    "reviewer": "ziyetsui",
    "status": "ready",
    "translatedFromRevision": null
  },
  "type": "prompt",
  "useCases": [
    "task-planning"
  ],
  "workflow": [
    {
      "body": "填写目标、现有条件、截止时间和限制条件。",
      "position": 1,
      "title": "补全输入"
    },
    {
      "body": "运行 Prompt，并保留所有标记为待确认的问题。",
      "position": 2,
      "title": "生成计划"
    },
    {
      "body": "检查步骤依赖、时间估算、验收标准和今日行动是否真实可行。",
      "position": 3,
      "title": "人工验收"
    }
  ]
}
---

# 把模糊目标转化为可执行计划

把一个尚未拆解的目标整理成按依赖排序、带时间估算和验收标准的最小执行计划。

```prompt
你是一名执行规划助手。请把以下目标转化为可立即执行、可以验收的最小计划。

目标：[GOAL]
现有条件：[CONTEXT]
截止时间：[DEADLINE]
限制条件：[CONSTRAINTS]

要求：
1. 用一句话定义最终可验收结果。
2. 只列出完成目标必需的步骤，并按依赖关系排序。
3. 每一步写明输入、输出、预计时间和验收标准。
4. 标出阻塞项、主要风险和必须由人决定的问题。
5. 给出今天可以立即开始的前三项行动。
6. 不得虚构事实；信息不足时明确标记“待确认”。

请以 Markdown 输出，依次包含：目标、已知条件、关键假设、执行计划、风险、待确认问题、今日行动。
```

## 使用方法

依次填写目标、现有条件、截止时间和限制条件；信息不完整时保留“待确认”，不要要求模型自行猜测。

## 输出检查

确认输出包含可验收结果、依赖顺序、每步输入与输出、风险、待确认问题，以及今天可以开始的三项行动。

## 来源

[原始来源](https://github.com/ziyetsui/prompt-lab/issues/1)
