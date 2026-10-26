/** Only classify known codes; never return raw provider messages, keys or request bodies. */
export function providerFailure(provider:string,status:number,payload:unknown){
 const p=payload&&typeof payload==='object'?payload as Record<string,unknown>:{};
 const error=p.error&&typeof p.error==='object'?p.error as Record<string,unknown>:p;
 const codes=[error.code,error.type];
 const quota=codes.some(c=>typeof c==='string'&&['insufficient_quota','credit_balance_exhausted','billing_hard_limit_reached','usage_limit_reached','spend_limit_reached'].includes(c));
 let reason='Verifique o estado do serviço e a configuração da API.';
 if(status===401)reason='Chave de API inválida ou não aceita. Confira a chave no .env e reinicie o servidor.';
 if(status===402)reason='Pagamento/créditos de API necessários. Confira saldo e cobrança da API na conta do provedor; trocar o ID da voz não resolve esse bloqueio.';
 if(status===403)reason='Acesso negado. Confira permissões da chave, do modelo e da voz.';
 if(status===404)reason='Recurso não encontrado. Confira endpoint, modelo e ID da voz.';
 if(status===422||status===400)reason='Parâmetros recusados. Confira modelo, ID da voz e formato da requisição.';
 if(status===429)reason=quota?'Quota/créditos de API esgotados ou limite financeiro atingido. Confira cobrança e limites do projeto da API.':codes.some(c=>c==='rate_limit_exceeded'||c==='rate_limit_error'||c==='slow_down')?'Limite temporário de requisições. Aguarde e aumente o intervalo entre respostas.':'Limite de requisições ou quota de API. Confira saldo e limites do projeto; HTTP 429 sozinho não distingue essas causas.';
 if(status>=500)reason='Falha temporária do serviço do provedor.';
 return `${provider}: HTTP ${status}. ${reason}`;
}
