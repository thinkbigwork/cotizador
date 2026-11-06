# Guia do cotador

Tudo o que é preciso para cotar a Wizor sem dúvidas. Os valores deste guia vêm da tabela de preços vigente (**{{catalogo.version}}**, publicada em {{catalogo.fecha}}) e se atualizam sozinhos quando uma nova é publicada.

Uso interno da equipe Wizor.

## O que é o cotador

É a ferramenta com que a equipe monta o preço da Wizor para uma organização, na hora e sem planilhas.

- **`/ventas`** · o cotador. Pode ser mostrado ao cliente: tem um **modo apresentação** que oculta tudo o que é interno.
- **`/ventas/comision`** · a comissão de quem vende. Abre em outra aba e nunca aparece no cotador nem neste guia.
- **`/admin/catalogo`** · o back office onde a Wizor altera preços.

**Idioma.** Todas as telas estão em espanhol, inglês e português. O seletor **ES · EN · PT** fica no topo de cada uma, e a escolha vale para todo o site. No modo apresentação ele também aparece, caso o cliente precise da tela no seu idioma.

## Como funciona

1. Informe a organização: **atividade**, **quantidade de pessoas**, **estabelecimentos** e **países**.
2. Escolha os **produtos** e, se for o caso, os **dispositivos**.
3. A tela envia esses dados ao servidor, que calcula com a tabela vigente e devolve o preço. O modelo de preços nunca vai ao navegador.
4. O cotador mostra o preço anual, o preço por pessoa por mês, o primeiro ano (plataforma + dispositivos) e como a venda fecha:

{{tabla.desenlaces}}

**O preço fica fixado à versão da tabela.** Cada cotação e cada contrato guardam a versão com que foram emitidos. Se amanhã os preços subirem, ninguém que já assinou é reprecificado.

## De onde vêm os números

O preço anual depende de três coisas: **atividade, quantidade de pessoas e produto**.

### 1 · A atividade define um fator

Como uma seguradora com sua alíquota: mais risco, tarifa maior. O Wizor Lens não aplica este fator; Core e 360 sim.

{{tabla.categorias}}

### 2 · Até {{autoservicio.max}} pessoas: faixa fechada

O preço anual sai de uma tabela por faixa de quadro de pessoal, multiplicada pelo produto (Lens ×1, Core ×2, 360 ×3) e pelo fator de atividade. Essas faixas **não** têm mínimo anual.

{{tabla.bandas}}

Os valores da tabela são antes do fator de atividade.

### 3 · Mais de {{autoservicio.max}} pessoas: tarifa por faixa

Cada pessoa paga a tarifa base do produto, que cai por faixa de volume. É **marginal**: cada faixa paga sua própria porcentagem, como o imposto de renda, então somar pessoas nunca faz o preço saltar.

{{tabla.curvas}}

Preço anual = soma das faixas × 12 × fator de atividade. Se o resultado for menor que **{{minimo}}**, cobra-se esse mínimo anual.

### Casos resolvidos

Calculados pelo mesmo motor que o cotador usa:

{{tabla.ejemplos}}

Todos os valores são de tabela, em dólares e sem impostos (IVA, TAX ou equivalente conforme o país).

## Porte da empresa

O cotador recomenda um canal conforme o porte e os países. **É uma recomendação, nunca um bloqueio**: qualquer empresa pode contratar sozinha se quiser.

{{tabla.canales}}

**Multinacionais.** Escolhem um país de contratação e cotam sobre o **quadro total**: o volume de todos os países define a faixa, e cada país mantém o instrumento que sua norma exige.

**Organizações de neurodivergência.** Pagam **zero** (princípio 4 do manifesto). Não há cobrança: são ativadas por solicitação.

## Produtos

{{tabla.productos}}

{{productos.descripciones}}

**O Wizor 360 absorve o Lens e o Core**: se o 360 for escolhido, os outros não se somam. Quando há vários produtos, o de maior nível define os relatórios e os usuários incluídos.

### Dispositivos

Comprados uma vez, sem mensalidade, e **só funcionam com um produto que os aceite**. O Wizor 360 os **exige**: sem sensores instalados não há medição.

{{tabla.equipos}}

- **Smart Desktop:** dispositivo fixo para espaços fechados; pode-se usar uma ou várias unidades por ambiente. Conectar e testar, totalmente silencioso. Mede ar, COV, ruído, temperatura, luz e vibrações, 24/7.
- **Painéis de controle:** o centro de monitoramento. Fadiga, estresse e qualidade do ar em tempo real: mais de 200 variáveis, latência menor que 1 segundo, na nuvem ou nas instalações do cliente, com análise preditiva.

## Pré-venda e sinal

**Em pré-venda hoje:** {{preventa.productos}}, e os dispositivos {{preventa.equipos}}.

{{preventa.entrega}}

Um produto em pré-venda aparece com seu preço, mas a assinatura não é cobrada: ele é **reservado com um sinal**.

{{seña.reglas}}

- É descontado do faturamento? **{{seña.descuenta}}**
- É reembolsável? **{{seña.reembolsable}}**
- A plataforma só é faturada quando a instalação estiver pronta.

## Como se vende

1. **Cotar com o cliente.** Abra `/ventas` e ative o **modo apresentação** se for mostrar a tela. A comissão fica em outra aba; nunca a deixe aberta ao lado.
2. **Seguir o canal sugerido.** Autoatendimento: o cliente contrata sozinho. Com acompanhamento: demo de 30 minutos com o quadro e os estabelecimentos reais. Proposta: oferta consolidada por país.
3. **Fechar conforme o desfecho** que o cotador mostra (pagamento, sinal, solicitação ou proposta).

**Contrato:** {{contrato.meses}} meses, faturamento {{contrato.facturacion}}. Uma cotação vale {{contrato.validez}} dias.

**Atividade fora da lista.** O cotador não calcula: o cliente descreve sua atividade e a Wizor responde com uma tarifa.

### Programa fundador

**Não é a pré-venda.** É um programa à parte para empresas pioneiras que co-desenvolvem com a Wizor. Há **{{fundador.cupos}} vagas por país** e quem decide a entrada é a Wizor.

{{fundador.beneficios}}

Níveis de Wizor Credits: {{fundador.creditos}}.

## Versões

### Tabela de preços

Atualiza-se sozinha a cada publicação no back office.

{{versiones.catalogo}}

### Cotador

| Data | Mudança |
|---|---|
| 6 nov 2026 | O logo leva ao guia a partir de qualquer tela (#7). |
| 6 nov 2026 | Todo o site em espanhol, inglês e português: cotador, comissão, acesso e back office. O idioma escolhido vale para todas as telas (#6). |
| 6 nov 2026 | Guia do cotador na página inicial, em espanhol, inglês e português, com esta seção de versões. |
| 6 nov 2026 | Tipografia, logo e cores de sales.wizor.io (#4). |
| 6 nov 2026 | A comissão fica visível com a senha compartilhada durante a etapa de testes (#3). |
| 6 nov 2026 | Correção: publicar uma tabela não pode mais deixar o site sem preços se falhar no meio do caminho (#2). |
| 6 nov 2026 | Publicação em quoter.wizor.io (Vercel + Neon). |
| 5 nov 2026 | Atualização de segurança do React Server Components (#1). |
| 5 nov 2026 | Lançamento: tabela de preços versionada, motor de preços, cotador, comissão em rota separada e back office. |

{{version.despliegue}}
