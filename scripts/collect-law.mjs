import {collectLaw} from '../lib/law-collector.mjs';
try{console.log(JSON.stringify(await collectLaw(),null,2))}catch(e){console.error(e.message);process.exitCode=1}
