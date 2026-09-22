/**
 * Large Context Sliding Window & Token Chunking
 * Reference implementation based on:
 * https://github.com/csdmichael/AI-Content-Safety-POC/tree/main/large-context
 */

class LargeContextChunker {
  /**
   * Split long text into overlapping chunks
   * @param {string} text - Source text
   * @param {number} chunkSize - Number of estimated tokens per chunk
   * @param {number} overlapTokens - Overlap window between consecutive chunks
   */
  static chunkText(text, chunkSize = 250, overlapTokens = 50) {
    if (!text) return [];

    // Approximate token count: 1 token ≈ 4 characters
    const charsPerToken = 4;
    const chunkChars = chunkSize * charsPerToken;
    const stepChars = (chunkSize - overlapTokens) * charsPerToken;

    const chunks = [];
    let start = 0;
    let chunkIndex = 1;

    while (start < text.length) {
      const end = Math.min(text.length, start + chunkChars);
      const chunkText = text.substring(start, end);
      chunks.push({
        chunkIndex,
        startChar: start,
        endChar: end,
        tokenStart: Math.round(start / charsPerToken),
        tokenEnd: Math.round(end / charsPerToken),
        text: chunkText
      });
      if (end >= text.length) break;
      start += stepChars;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Aggregate individual chunk safety decisions using MAX_SEVERITY
   * @param {Array} chunkResults - Array of evaluated chunk results
   */
  static aggregateResults(chunkResults) {
    let maxRisk = 0;
    let isBlocked = false;
    let aggregatedFlags = new Set();

    for (const res of chunkResults) {
      if (res.riskScore > maxRisk) {
        maxRisk = res.riskScore;
      }
      if (res.decision === 'BLOCKED') {
        isBlocked = true;
      }
      if (res.detectedFlags) {
        res.detectedFlags.forEach(f => aggregatedFlags.add(f));
      }
    }

    return {
      decision: isBlocked ? 'BLOCKED' : (maxRisk > 30 ? 'AUDIT_REQUIRED' : 'APPROVED'),
      maxRiskScore: maxRisk,
      flags: Array.from(aggregatedFlags),
      totalChunksEvaluated: chunkResults.length,
      aggregationStrategy: 'MAX_SEVERITY'
    };
  }
}

module.exports = LargeContextChunker;
