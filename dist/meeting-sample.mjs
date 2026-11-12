// Add an explicitly recorded, fictional example without replacing existing work.
export async function addRecordedMeetingSample(state, sample) {
  if (sample?.kind !== 'recorded-fictional-demo' || sample.matter?.id !== 'ML-MEETING-1112'
      || !Array.isArray(sample.documents) || !Array.isArray(sample.tasks)
      || sample.documents.some(d => d.matter !== sample.matter.id)
      || sample.tasks.some(t => t.matter !== sample.matter.id)) throw Error('Meeting sample is not valid.');
  const next = structuredClone(state);
  for (const key of ['matters', 'tasks', 'documents', 'approvals']) next[key] ??= [];
  for (const [key, rows] of [['matters', [sample.matter]], ['tasks', sample.tasks], ['documents', sample.documents]]) {
    for (const row of rows) if (!next[key].some(existing => existing.id === row.id)) next[key].unshift(structuredClone(row));
  }
  const doc = next.documents.find(d => d.id === sample.recordedDocumentId);
  const original = sample.documents.find(d => d.id === sample.recordedDocumentId);
  if (!doc || !original) throw Error('Recorded work product is missing.');
  // A modified or already reviewed example remains as the presenter left it.
  if (doc.text === original.text && doc.name === original.name && !next.approvals.some(a => a.documentId === doc.id)) {
    const bytes = new TextEncoder().encode(JSON.stringify({id:doc.id, matter:doc.matter, text:doc.text, name:doc.name}));
    const documentHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
    next.approvals.unshift({id:'ML-DEMO-RECORDED-REVIEW', gate:'Case acceptance', documentId:doc.id,
      documentHash, matter:doc.matter, title:doc.name, status:'Pending review',
      requestedBy:'Demo reviewer', date:new Date().toISOString()});
  }
  return next;
}
