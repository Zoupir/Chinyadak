export function detectConfirmedOverwrites(stages) {
  const confirmed = [];
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
        confirmed.push({
          type: 'exact-revert',
          file: change.file,
          introducedBy: revertedState.script,
          overwrittenBy: stage.script,
          revertedToHash: change.afterHash,
          replacedHash: change.beforeHash || null,
          stageIndex: index
        });
      }

      history.push({
        script: stage.script,
        beforeHash: change.beforeHash || null,
        afterHash: change.afterHash || null
      });
      historyByFile.set(change.file, history);
    }
  }

  const seen = new Set();
  return confirmed.filter(item => {
    const key = `${item.file}:${item.introducedBy}:${item.overwrittenBy}:${item.revertedToHash}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
