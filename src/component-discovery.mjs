export const DISCOVERY_PROFILES = ['educational', 'social', 'documentary', 'product'];
export const DISCOVERY_ASPECTS = ['portrait', 'landscape', 'square'];

const roles = {
  narrative: {
    profiles: ['documentary', 'educational', 'social'],
    names: /dialogue stage|gateway arrival/,
    aliases: ['narrative 3d', '3d narrative', 'dialog', 'dialogue', 'scena narativa', 'sosire', 'arrival'],
  },
  title: {
    profiles: ['educational', 'social', 'documentary', 'product'],
    names: /kinetic type|title ?card|text stagger|per word rise/,
    aliases: ['titlu', 'titlu animat', 'text cinetic', 'animated title', 'kinetic typography', 'opening title', 'hook'],
  },
  diagram: {
    profiles: ['educational', 'product'],
    names: /signal diagram|flowchart|decision tree|exploded stack|hw pipeline/,
    aliases: ['diagram', 'diagrama', 'flowchart', 'schema animata', 'process diagram'],
  },
  comparison: {
    profiles: ['educational', 'product'],
    names: /comparison|before after|split screen|panel reveal/,
    aliases: ['comparatie', 'compara', 'inainte si dupa', 'before and after', 'side by side'],
  },
  timeline: {
    profiles: ['educational', 'documentary'],
    names: /timeline|chronology|chronological/,
    aliases: ['cronologie', 'linie temporala', 'chronology', 'timeline'],
  },
  chart: {
    profiles: ['educational', 'documentary', 'product'],
    names: /chart|count up|graph|stat callout/,
    aliases: ['grafic', 'grafice', 'diagrama cu bare', 'statistici', 'data chart', 'bar chart', 'line graph'],
  },
  recap: {
    profiles: ['educational', 'social', 'documentary'],
    names: /recap|summary|end card|titlecard lockup|takeaway/,
    aliases: ['recapitulare', 'rezumat', 'concluzie', 'concluzii', 'key takeaway', 'summary card'],
  },
  showcase: {
    profiles: ['product', 'social'],
    names: /showcase|product promo|device splay/,
    aliases: ['prezentare produs', 'demo produs', 'product demo', 'product showcase'],
  },
};

export const DISCOVERY_ROLES = Object.keys(roles);
const stopWords = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'to', 'for', 'with', 'and', 'or',
  'de', 'din', 'la', 'pe', 'cu', 'si', 'un', 'o', 'pentru', 'intre', 'care', 'prin']);
const hasPhrase = (text, phrase) => text === phrase || ` ${text} `.includes(` ${phrase} `);
const normalize = text => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').match(/[\p{L}\p{N}]+/gu)?.join(' ') ?? '';
const words = text => text ? text.split(' ') : [];
const aspect = ({ width, height }) => height > width ? 'portrait' : width > height ? 'landscape' : 'square';

export function validDiscoveryContext(input) {
  if (input.profiles !== undefined && (!Array.isArray(input.profiles) || input.profiles.length > DISCOVERY_PROFILES.length
    || new Set(input.profiles).size !== input.profiles.length || !input.profiles.every(profile => DISCOVERY_PROFILES.includes(profile)))) return false;
  if (input.aspect !== undefined && !DISCOVERY_ASPECTS.includes(input.aspect)) return false;
  if (input.role !== undefined && !DISCOVERY_ROLES.includes(input.role)) return false;
  return input.topic === 'component-discovery' || [input.profiles, input.aspect, input.role].every(value => value === undefined);
}

function formatEvidence(template, port) {
  const config = template.config;
  const defaultAspect = config?.width && config?.height ? aspect(config) : undefined;
  const checks = (port?.verification?.runtimeCapture?.checks ?? port?.verification?.checks ?? [])
    .filter(check => check.rendered === true && check.width > 0 && check.height > 0);
  return {
    ...(defaultAspect ? { defaultAspect } : {}),
    verifiedAspects: DISCOVERY_ASPECTS.filter(value => checks.some(check => aspect(check) === value)),
    ...(typeof config?.duration === 'number' ? { defaultDuration: config.duration } : {}),
    ...(typeof config?.captionSafeArea === 'boolean' ? { captionSafeArea: config.captionSafeArea } : {}),
  };
}

export function buildDiscoveryIndex(templates, hyperframes, native, files) {
  const ports = new Map(hyperframes.filter(entry => entry.nativeStatus === 'ported').map(entry => [entry.nativeTemplateId, entry]));
  const evidence = new Map(native.filter(entry => entry.status === 'ported').map(entry => [entry.nativeTemplateId, entry]));
  return templates.flatMap(template => {
    const port = ports.get(template.id);
    if (!files[`scene-templates/${template.id}.svelte`] || (template.id.startsWith('hyperframes-') && !port)) return [];
    const id = normalize(template.id.replace(/^hyperframes-(?:blocks-|components-|examples-)?/, ''));
    const label = normalize(template.label.replace(/^Hyperframes:\s*/i, ''));
    const tags = new Set(words(normalize((port?.tags ?? []).join(' '))));
    const details = new Set(words(normalize(`${template.description ?? ''} ${(template.whenToUse ?? []).join(' ')}`)));
    const entryRoles = DISCOVERY_ROLES.filter(role => roles[role].names.test(`${id} ${label}`) || template.category === role);
    return [{
      id, label, name: new Set(words(`${normalize(template.id)} ${label}`)), tags, details, roles: entryRoles,
      profiles: DISCOVERY_PROFILES.filter(profile => entryRoles.some(role => roles[role].profiles.includes(profile))),
      candidate: {
        id: template.id, label: template.label, description: template.description,
        family: port ? 'hyperframes' : 'machinal', status: 'installed-template',
        visualMode: template.visualMode, requiredImages: template.requiredImages ?? [], requiredVideos: template.requiredVideos ?? [],
        format: formatEvidence(template, evidence.get(template.id)),
        editableParameters: (template.parameters ?? []).map(parameter => typeof parameter === 'string' ? parameter : parameter.path).filter(Boolean),
        source: { topic: 'scene-templates', id: template.id },
        compileInput: { templateId: template.id },
      },
    }];
  });
}

function scoreCandidate(entry, search) {
  const { phrase, terms, matchedRoles, role, profiles, aspect: requestedAspect } = search;
  const hits = terms.map(term => entry.name.has(term) ? 6 : entry.tags.has(term) ? 3 : entry.details.has(term) ? 1 : 0);
  const coverage = hits.filter(Boolean).length;
  const exact = phrase && (entry.id === phrase || entry.label === phrase || normalize(entry.candidate.id) === phrase);
  const phraseMatch = phrase && [entry.id, entry.label].some(name => hasPhrase(name, phrase));
  const matchingRoles = entry.roles.filter(value => matchedRoles.includes(value));
  const matchingRole = matchingRoles.includes(role);
  const matchingProfiles = profiles.filter(profile => entry.profiles.includes(profile));
  const partial = coverage >= Math.min(2, terms.length) && coverage > 0
    && (coverage === terms.length || hits.some(value => value >= 3) || coverage / terms.length >= 0.5);
  if (!(exact || phraseMatch || partial || matchingRoles.length)) return null;
  const { format } = entry.candidate;
  const verifiedAspect = format.verifiedAspects.includes(requestedAspect);
  const defaultAspect = requestedAspect && format.defaultAspect === requestedAspect;
  const reasons = [
    ...(exact ? ['Exact template name'] : phraseMatch ? ['Action phrase in template name'] : []),
    ...(matchingRoles.length ? [`Scene role: ${matchingRoles.join(', ')}`] : []),
    ...(coverage ? [`Matched action terms: ${terms.filter((_, index) => hits[index]).join(', ')}`] : []),
    ...(matchingProfiles.length ? [`Profile fit: ${matchingProfiles.join(', ')}`] : []),
    ...(defaultAspect ? [`Default layout: ${requestedAspect}`] : []),
    ...(verifiedAspect ? [`Recorded runtime capture: ${requestedAspect}`] : []),
  ];
  const score = (exact ? 45 : phraseMatch ? 22 : 0)
    + hits.reduce((total, value) => total + value, 0)
    + (terms.length ? 10 * coverage / terms.length : 0)
    + (matchingRole ? 17 : matchingRoles.length ? 14 : 0)
    + matchingProfiles.length * 2 + (verifiedAspect ? 5 : 0) + (defaultAspect ? 8 : 0)
    + (entry.candidate.editableParameters.length ? 2 : 0);
  return { score, candidate: { ...entry.candidate, roles: entry.roles, profiles: entry.profiles, matchReasons: reasons } };
}

export function rankComponents(index, { query, role, profiles = [], aspect }) {
  const phrase = normalize(query ?? '');
  const terms = [...new Set(words(phrase).filter(word => !stopWords.has(word)))];
  if (!terms.length && !role) throw new Error('Use an action query or a scene role for component-discovery; read exact IDs via scene-templates.');
  const aliases = DISCOVERY_ROLES.filter(value => roles[value].aliases.some(alias => hasPhrase(phrase, alias)));
  // An explicit role can boost relevant matches, but must not turn an unrelated query into a match.
  const matchedRoles = terms.length ? (role && aliases.includes(role) ? [role] : aliases) : [role];
  return index.map(entry => scoreCandidate(entry, { phrase, terms, matchedRoles, role, profiles, aspect }))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || Number(b.candidate.family === 'hyperframes') - Number(a.candidate.family === 'hyperframes')
      || a.candidate.id.localeCompare(b.candidate.id, 'en'))
    .map(({ candidate }) => candidate);
}
