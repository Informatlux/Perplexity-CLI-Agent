// Semantic Router - classifies queries for optimal model selection
export function classifyQuery(query) {
  const complexPatterns = [
    /fix.*bug/i,
    /debug/i,
    /why.*fail/i,
    /root cause/i,
    /complex/i,
    /architecture/i,
    /design pattern/i,
    /optimize/i,
    /refactor/i,
    /security/i,
    /memory leak/i
  ];

  if (complexPatterns.some(p => p.test(query))) {
    return "sonar-reasoning";
  }
  
  return null; // use default
}

export function isConversationalQuery(query) {
  const conversational = [
    /^(hi|hello|hey|yo|sup|wassup)$/i,
    /^(thanks|thank you|thx|ty)$/i,
    /^(ok|okay|cool|nice|awesome|great)$/i,
    /^(bye|goodbye|see you|later)$/i,
    /^(yes|no|yep|nope|yeah|nah)$/i,
    /^(lol|lmao|haha|😂|👍)$/i,
    /^(oh|hmm|uh|ah|wow)$/i,
  ];

  const queryLower = query.toLowerCase().trim();

  // Check if it's just a short conversational response
  if (queryLower.length < 15 && conversational.some(r => r.test(queryLower))) {
    return true;
  }

  // Check if it's a simple acknowledgment with "bro", "man", etc.
  if (/^(ok|cool|nice|thanks|alright)\s+(bro|man|dude|mate)/i.test(queryLower)) {
    return true;
  }
  
  return false;
}
