(()=>{const D=FF.D;const out=Object.values(D.MAPS).map(m=>m.id+' ['+m.theme+'] '+m.w+'x'+m.h+' e:'+(m.ents||[]).map(e=>e.t).join(','));return out.join('\n');})()
