import { FIELD_DICTIONARY } from '../src/data/fieldDictionary.js';

FIELD_DICTIONARY.forEach((module, mIdx) => {
  module.groups.forEach((group, gIdx) => {
    group.fields.forEach((field, fIdx) => {
      if (!field.name) console.log(`Missing name: Module ${mIdx}, Group ${gIdx}, Field ${fIdx}`);
      if (!field.type) console.log(`Missing type: Module ${mIdx}, Group ${gIdx}, Field ${fIdx}`);
      if (!field.description) console.log(`Missing description: Module ${mIdx}, Group ${gIdx}, Field ${fIdx}`);
    });
  });
});
console.log("Validation complete.");
