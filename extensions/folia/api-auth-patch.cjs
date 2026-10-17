'use strict';
exports.patch=source=>{
  const anchor='openApi_httpServer = external_node_http_default().createServer((req, res) => {';
  if(source.includes('/* LX_FOLIA_API_AUTH */'))return source;
  if(source.split(anchor).length!==2)throw Error('LX Open API handler changed; refusing an unprotected build');
  return source.replace(anchor,anchor+'\n        /* LX_FOLIA_API_AUTH */ if (!require("./folia/api-auth.cjs").guard(req, res)) return; if (require("./folia/ktv-route.cjs").handle(req,res)) return;');
};
