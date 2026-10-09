import path from 'node:path';

const isIntentionalNormalization = script => path.basename(String(script || '')).startsWith('normalize-');

export function analyzePipelineReverts(stages) {
  const confirmedOverwrites = [];
  const normalizationReverts = [];
  const historyByFile = new Map();

  for (let index = 0; index < stages.length; index += 1) {
    const stage = stages[index];
    if (stage?.kind !== 'stage' || !Array.isArray(stage.changes)) continue;

    for (const change of stage.changes) {
      if (!change?.file || !change?.afterHash) continue;
      const history = historyByFile.get(change.file) || [];
      const revertedState = history
        .slice()
        .reverse()
        .find(item => item.beforeHash && item.beforeHash === change.afterHash && item.script !== stage.script);

      if (revertedState) {
        const event = {
          type: 'exact-revert',
          file: change.file,
          introducedBy: revertedState.script,
          overwrittenBy: stage.script,
          revertedToHash: change.afterHash,
          replacedHash: change.beforeHash || null,
          stageIndex: index
        };
        if (isIntentionalNormalization(stage.script)) normalizationReverts.push(event);
        else confirmedOverwrites.push(event);
      }

      history.push({
        script: stage.script,
        beforeHash: change.beforeHash || null,
        afterHash: change.afterHash || null
      });
      historyByFile.set(change.file, history);
    }
  }

  const dedupe = items => {
    const seen = new Set();
    return items.filter(item => {
      const key = `${item.file}:${item.introducedBy}:${item.overwrittenBy}:${item.revertedToHash}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    confirmedOverwrites: dedupe(confirmedOverwrites),
    normalizationReverts: dedupe(normalizationReverts)
  };
}

export function detectConfirmedOverwrites(stages) {
  return analyzePipelineReverts(stages).confirmedOverwrites;
}
