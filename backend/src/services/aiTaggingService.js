import logger from '../utils/logger.js';

const AI_TOPICS = {
  'prompt-injection': {
    keywords: [
      'prompt injection', 'prompt leak', 'prompt attack', 'jailbreak prompt',
      'system prompt extraction', 'prompt engineering attack', 'indirect prompt injection',
      'prompt hijacking', 'prompt exfiltration', 'prompt stealing', 'prompt injection defense',
      'prompt guard', 'prompt filter bypass', 'role-based prompt', 'dan prompt',
      'jailbreak technique', 'prompt obfuscation', 'multi-turn jailbreak',
      'cross-modal prompt injection', 'visual prompt injection', 'audio prompt injection',
    ],
    color: '#f5222d',
    label: 'Prompt Injection',
  },
  'llm-security': {
    keywords: [
      'llm security', 'large language model security', 'gpt security', 'claude security',
      'gemini security', 'llama security', 'foundation model security', 'chatgpt vulnerability',
      'copilot security', 'llm vulnerability', 'llm attack', 'ai model security',
      'language model attack', 'llm exploitation', 'llm bug', 'llm flaw',
      'llm threat', 'chatbot security', 'conversational ai security',
      'api-based llm', 'llm endpoint', 'llm proxy attack',
    ],
    color: '#fa541c',
    label: 'LLM Security',
  },
  'adversarial-attack': {
    keywords: [
      'adversarial attack', 'adversarial example', 'adversarial perturbation',
      'evasion attack', 'adversarial ml', 'adversarial robustness', 'adversarial machine learning',
      'adversarial input', 'adversarial prompt', 'adversarial patch',
      'gradient-based attack', 'white-box attack', 'black-box attack',
      'universal adversarial', 'adversarial suffix', 'adversarial prefix',
      'skeleton key attack', 'many-shot jailbreaking', 'adversarial images',
    ],
    color: '#fa8c16',
    label: 'Adversarial Attack',
  },
  'model-stealing': {
    keywords: [
      'model stealing', 'model extraction', 'model theft', 'model inversion',
      'membership inference', 'training data extraction', 'model cloning',
      'model reverse engineering', 'gradient leakage', 'model fingerprinting',
      'model watermark removal', 'fine-tuning data leak', 'logit extraction',
      'model distillation attack', 'teacher-student attack',
    ],
    color: '#eb2f96',
    label: 'Model Stealing',
  },
  'data-poisoning': {
    keywords: [
      'data poisoning', 'model poisoning', 'backdoor attack', 'supply chain attack ml',
      'training data manipulation', 'poisoned dataset', 'trojan attack',
      'neural trojan', 'weight poisoning', 'label poisoning',
      'clean-label attack', 'dirty-label attack', 'backdoor trigger',
      'poison injection', 'training pipeline attack', 'data contamination',
    ],
    color: '#722ed1',
    label: 'Data Poisoning',
  },
  'ai-governance': {
    keywords: [
      'ai governance', 'ai regulation', 'ai policy', 'ai act', 'ai compliance',
      'executive order ai', 'ai safety regulation', 'ai standards', 'nist ai',
      'ai framework', 'ai risk management', 'eu ai act', 'ai bill',
      'ai legislation', 'ai regulatory', 'ai liability', 'ai accountability',
      'ai transparency', 'ai auditing', 'ai certification', 'iso ai',
      'ai ethics guidelines', 'responsible ai', 'ai treaty',
    ],
    color: '#2f54eb',
    label: 'AI Governance',
  },
  'ai-red-teaming': {
    keywords: [
      'ai red team', 'ai red teaming', 'ai penetration testing', 'model testing',
      'ai vulnerability assessment', 'llm pentest', 'ai security testing',
      'ai bug bounty', 'model red teaming', 'ai threat modeling',
      'ai attack surface', 'model evaluation security', 'ai purple team',
      'automated red teaming', 'ai security audit',
    ],
    color: '#13c2c2',
    label: 'AI Red Teaming',
  },
  'rag-security': {
    keywords: [
      'rag security', 'retrieval augmented generation security', 'vector database attack',
      'embedding attack', 'knowledge base poisoning', 'rag injection',
      'retrieval poisoning', 'vector poisoning', 'embedding inversion',
      'rag prompt injection', 'document poisoning', 'chunk manipulation',
      'semantic attack', 'similarity attack', 'vector store security',
    ],
    color: '#52c41a',
    label: 'RAG Security',
  },
  'ai-agent-security': {
    keywords: [
      'ai agent security', 'autonomous agent attack', 'agent hijacking',
      'tool use attack', 'function calling security', 'mcp security',
      'agent poisoning', 'multi-agent attack', 'agent prompt injection',
      'ai agent vulnerability', 'agent sandbox escape', 'tool poisoning',
      'plugin security ai', 'agent manipulation', 'agent goal hijacking',
    ],
    color: '#a0d911',
    label: 'AI Agent Security',
  },
  'ai-supply-chain': {
    keywords: [
      'ai supply chain', 'model supply chain', 'ml supply chain',
      'hugging face security', 'pytorch vulnerability', 'tensorflow vulnerability',
      'mlflow security', 'model registry attack', 'pretrained model trojan',
      'model hub security', 'safetensors vulnerability', 'pickle vulnerability',
      'model serialization attack', 'mlops security', 'ml pipeline security',
      'model artifact poisoning', 'dependency confusion ml',
    ],
    color: '#faad14',
    label: 'AI Supply Chain',
  },
  'ai-vulnerability': {
    keywords: [
      'ai vulnerability', 'cve ai', 'ai cve', 'machine learning vulnerability',
      'deep learning vulnerability', 'neural network vulnerability', 'ai exploit',
      'ai zero-day', 'ai security flaw', 'model vulnerability disclosure',
      'ai bug bounty report', 'ai security advisory', 'llm cve',
    ],
    color: '#cf1322',
    label: 'AI Vulnerability',
  },
  'ai-safety-alignment': {
    keywords: [
      'ai policy', 'ai regulation update', 'ai regulatory change', 'ai law',
      'ai legislation update', 'ai bill passed', 'ai executive order',
      'ai compliance requirement', 'ai standard', 'ai framework update',
      'ai policy news', 'ai regulatory news', 'ai government',
      'ai safety', 'ai alignment', 'ai control problem', 'superalignment',
      'constitutional ai', 'ai harm prevention', 'model refusal',
      'ai behavior control', 'safety training', 'ai governance update',
      'ai policy brief', 'ai licensing', 'ai registration', 'ai reporting',
      'ai transparency policy', 'ai accountability policy',
    ],
    color: '#1890ff',
    label: 'AI Policy & Regulation',
  },
  'ai-privacy': {
    keywords: [
      'ai privacy', 'model privacy', 'differential privacy ai', 'federated learning security',
      'training data privacy', 'ai gdpr', 'model memorization', 'pii extraction llm',
      'privacy-preserving ml', 'model unlearning', 'data deletion ai',
      'privacy leakage ai', 'model inversion privacy', 'attribute inference',
    ],
    color: '#7c3aed',
    label: 'AI Privacy',
  },
  'generative-ai-security': {
    keywords: [
      'generative ai security', 'genai security', 'image generation security',
      'deepfake detection', 'deepfake security', 'synthetic media security',
      'ai-generated content detection', 'voice cloning security', 'deepfake fraud',
      'genai threat', 'text-to-image security', 'ai video security',
      'generative model attack', 'diffusion model security',
    ],
    color: '#c41d7f',
    label: 'Generative AI Security',
  },
  'ai-threat-intel': {
    keywords: [
      'ai threat intelligence', 'ai-powered attack', 'ai cyber attack',
      'ai disinformation', 'ai phishing', 'ai-powered malware', 'ai social engineering',
      'ai cybercrime', 'malicious ai', 'ai-enabled threat', 'ai cyber threat',
      'ai fraud', 'deepfake scam', 'ai voice phishing', 'ai business email compromise',
    ],
    color: '#d4380d',
    label: 'AI Threat Intelligence',
  },
  'ai-incident': {
    keywords: [
      'ai security incident', 'ai data breach', 'ai system compromise',
      'model leak', 'ai service outage', 'ai incident response',
      'ai forensics', 'ai security event', 'model breach', 'ai hack',
      'ai account takeover', 'api key leak ai', 'model endpoint breach',
    ],
    color: '#d48806',
    label: 'AI Security Incident',
  },
};

// Compile keywords into a flat map for fast lookup: keyword → topicKey
const keywordMap = new Map();
for (const [topicKey, topic] of Object.entries(AI_TOPICS)) {
  for (const kw of topic.keywords) {
    const normalized = kw.toLowerCase().trim();
    if (!keywordMap.has(normalized) || keywordMap.get(normalized).length < kw.length) {
      keywordMap.set(normalized, topicKey);
    }
  }
}

const sortedKeywords = [...keywordMap.keys()].sort((a, b) => b.length - a.length);

/**
 * Scan text for AI security keywords and return matched topics with scores.
 * Title matches are weighted 2x compared to description matches.
 */
export function tagAIRelevance(event) {
  const title = (event.title || '').toLowerCase();
  const description = (event.description || '').toLowerCase();
  const combined = title + ' ' + description;

  const topicScores = {};
  let totalScore = 0;

  for (const keyword of sortedKeywords) {
    const topicKey = keywordMap.get(keyword);
    if (!topicKey) continue;

    const inTitle = title.includes(keyword);
    const inDesc = description.includes(keyword);

    if (inTitle || inDesc) {
      const weight = inTitle ? 2 : 1;
      const score = weight * (keyword.split(' ').length >= 2 ? 2 : 1);

      topicScores[topicKey] = (topicScores[topicKey] || 0) + score;
      totalScore += score;
    }
  }

  // Normalize score to 0-1 range
  const normalizedScore = Math.min(totalScore / 10, 1.0);

  // Collect tags that met the threshold (at least 1 point)
  const tags = Object.entries(topicScores)
    .filter(([, score]) => score >= 1)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key)
    .slice(0, 5);

  return { score: normalizedScore, tags };
}

/**
 * Batch tag events, returning enriched events with ai_relevance_score and tags.
 */
export function batchTagEvents(events) {
  return events.map((event) => {
    const { score, tags } = tagAIRelevance(event);
    return {
      ...event,
      ai_relevance_score: score,
      _tags: tags,
    };
  });
}

/**
 * Get trending AI tags with counts from the database.
 */
export async function getTrendingTags(pool, limit = 20) {
  try {
    const result = await pool.query(
      `SELECT et.tag_name, COUNT(*) as article_count
       FROM event_tags et
       JOIN events e ON et.event_id = e.id
       WHERE e.event_type = 'news'
         AND e.published_date >= datetime('now', '-7 days')
       GROUP BY et.tag_name
       ORDER BY article_count DESC
       LIMIT $1`,
      [limit]
    );
    return (result.rows || []).map((row) => ({
      tag: row.tag_name,
      count: parseInt(row.article_count),
      topic: AI_TOPICS[row.tag_name] || null,
    }));
  } catch {
    return [];
  }
}

/**
 * Get the topic configuration map.
 */
export function getTopicConfig() {
  return AI_TOPICS;
}

export default {
  tagAIRelevance,
  batchTagEvents,
  getTrendingTags,
  getTopicConfig,
};
