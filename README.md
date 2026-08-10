# Ludos

Loja virtual de action figures desenvolvida como Projeto Integrador da disciplina de Desenvolvimento de Aplicações Dinâmicas (DAD).

A Ludos oferece uma experiência completa de comércio eletrônico, incluindo catálogo dinâmico, autenticação, favoritos, carrinho, checkout, gerenciamento de endereços, perfil de usuário e recursos de acessibilidade.

## Objetivo

Desenvolver um MVP funcional de uma loja virtual utilizando JavaScript Vanilla, integração com serviços externos e persistência de dados.

O projeto busca oferecer uma experiência:

- Responsiva em dispositivos móveis e desktops;
- Acessível segundo princípios da WCAG 2.1 AA;
- Organizada em módulos;
- Integrada a um serviço real de autenticação e persistência;
- Navegável por teclado e tecnologias assistivas.

## Funcionalidades

### Autenticação

- Cadastro de usuários;
- Login com sessão persistente;
- Recuperação e redefinição de senha;
- Proteção de páginas privadas;
- Logout;
- Redirecionamento de usuários autenticados e não autenticados.

### Catálogo

- Carregamento dinâmico de produtos;
- Busca por nome;
- Pesquisa por voz, quando suportada pelo navegador;
- Ordenação alfabética;
- Ordenação por menor ou maior preço;
- Ordenação por desconto;
- Página de detalhes do produto;
- Exibição de preço, estoque, descrição e avaliações.

### Carrinho

- Adição e remoção de produtos;
- Alteração de quantidade;
- Seleção dos produtos que serão comprados;
- Cálculo do subtotal e valor total;
- Persistência local do carrinho;
- Validação de estoque;
- Continuidade para o checkout.

### Favoritos e avaliações

- Adição e remoção de produtos favoritos;
- Persistência da lista de favoritos;
- Visualização das avaliações dos produtos;
- Cadastro de avaliações;
- Associação das avaliações ao usuário autenticado.

### Checkout

- Seleção dos produtos;
- Escolha do endereço de entrega;
- Cadastro e seleção de cartões;
- Identificação da bandeira do cartão;
- Pagamento por Pix;
- Criação e persistência do pedido;
- Atualização do estoque;
- Páginas de sucesso e erro.

> Este é um projeto acadêmico. Não existe integração com um gateway de pagamento real.

### Endereços

- Cadastro de endereço;
- Consulta automática do CEP;
- Seleção de estado;
- Edição de endereço;
- Definição de um endereço padrão;
- Associação dos endereços ao usuário autenticado.

### Perfil

- Exibição do nome e e-mail do usuário;
- Upload da foto de perfil;
- Imagem padrão para usuários sem foto;
- Seleção do endereço padrão;
- Acesso a cartões, favoritos, pedidos e avaliações;
- Logout da conta.

### Acessibilidade

- Alteração do tamanho dos textos;
- Fonte alternativa para facilitar a leitura;
- Guia visual de leitura que acompanha ponteiro e foco;
- Temas automático, claro e escuro;
- Adaptações de cores para protanopia, deuteranopia e tritanopia;
- Redefinição das preferências de acessibilidade;
- Persistência das preferências;
- Aplicação automática das preferências nas páginas;
- Suporte a conteúdos criados dinamicamente;
- Elementos HTML semânticos;
- Textos alternativos para imagens;
- Labels associados aos campos;
- Foco visível em elementos interativos;
- Atributos ARIA em componentes dinâmicos;
- Navegação por teclado.

### Área administrativa

A interface administrativa possui:

- Listagem de produtos;
- Busca;
- Formulário visual de cadastro de produtos;
- Formulário visual de alteração;
- Preview do produto;
- Cadastro de cupons;
- Confirmação de exclusão;
- Layout responsivo.

As operações da área administrativa são integradas ao Firebase Firestore e ao Cloudinary. Produtos podem ser cadastrados, alterados e excluídos, enquanto cupons são persistidos em coleção própria. O acesso é restrito a usuários com a função `admin`.

## Tecnologias utilizadas

### Front-end

- HTML5 semântico;
- CSS3;
- JavaScript Vanilla;
- ES Modules;
- DOM API;
- Local Storage;
- Session Storage;
- Fetch API;
- Web Speech API;
- Dialog API.

### Backend e persistência

- Firebase Authentication;
- Firebase Firestore;
- Firebase SDK para Web;
- Serviço externo para recuperação de senha.

### APIs e serviços externos

- API do IBGE para carregamento dos estados;
- Serviço de consulta de CEP;
- Cloudinary para upload de imagens;
- Lucide Icons para os ícones da interface;
- Google Fonts para as fontes Montserrat e DM Sans.

## Decisões técnicas

O projeto utiliza JavaScript Vanilla para atender aos requisitos acadêmicos e demonstrar domínio de:

- Manipulação do DOM;
- Eventos;
- Programação assíncrona;
- Modularização;
- Persistência;
- Integração entre interface e serviços;
- Tratamento de estados de carregamento, sucesso e erro.

O Firebase foi escolhido por reunir autenticação e banco de dados em uma solução adequada ao escopo e ao prazo de desenvolvimento do MVP.

O código está separado principalmente em:

- Models para representar as entidades;
- Services para persistência e integrações;
- Pages para as páginas HTML;
- Assets para CSS, JavaScript e imagens;
- Routes para proteção e navegação entre páginas;
- Config para configurações compartilhadas.

## Estrutura do projeto

```text
ludos/
├── index.html
├── LICENSE
├── README.md
└── src/
    ├── assets/
    │   ├── css/
    │   ├── images/
    │   └── js/
    ├── config/
    │   ├── firebase.js
    │   └── rotas.js
    ├── models/
    │   ├── Avaliacao.js
    │   ├── Endereco.js
    │   ├── Pedido.js
    │   ├── Produto.js
    │   └── Usuario.js
    ├── pages/
    ├── routes/
    │   └── router.js
    └── services/
```

## Modelagem e coleções

O Firestore utiliza as seguintes coleções principais:

### `usuarios`

Armazena os dados do usuário:

```js
{
  nome: "Nome do usuário",
  email: "usuario@email.com",
  role: "cliente",
  imagemUrl: "https://...",
  enderecos: []
}
```

O campo `imagemUrl` é opcional. Usuários sem foto continuam utilizando o ícone padrão.

### `produtos`

Armazena informações do catálogo, como:

```js
{
  nome: "Nome do produto",
  descricao: "Descrição",
  preco: 249.90,
  desconto: 20,
  estoque: 15,
  franquia: "Franquia",
  imagem: "https://...",
  ativo: true
}
```

### `pedidos`

Armazena os pedidos realizados e sua associação com o usuário.

### `avaliacoes`

Armazena avaliações, comentários, notas, produtos e usuários relacionados.

### `cupons`

Armazena o código, percentual de desconto, validade e estado ativo de cada cupom cadastrado pela área administrativa.

### Relações principais

- Cada endereço, pedido, favorito e avaliação é associado ao identificador do usuário autenticado;
- Cada item de pedido referencia um produto e registra sua quantidade;
- O pedido preserva valores de subtotal, desconto e total utilizados no momento da compra;
- A avaliação referencia o produto, o usuário e, quando aplicável, o pedido que autorizou a avaliação.

### `bandeiras_cartao`

Armazena informações utilizadas para identificar e exibir as bandeiras dos cartões.

## Como executar

### Pré-requisitos

É necessário possuir:

- Git;
- Navegador moderno;
- Um servidor HTTP local, como Live Server ou o servidor do Python;
- Conexão com a internet para Firebase, Cloudinary, APIs externas, fontes e ícones.

### Clonar o repositório

```bash
git clone https://github.com/Ludos-Souk/ludos.git
cd ludos
```

### Executar com Python

```bash
python -m http.server 5500
```

Depois, acesse:

```text
http://localhost:5500
```

### Executar com VS Code

1. Abra a pasta do projeto no VS Code;
2. Instale a extensão Live Server;
3. Abra o arquivo `index.html`;
4. Selecione **Open with Live Server**.

> Não é recomendado abrir os arquivos HTML diretamente pelo protocolo `file://`, pois o projeto utiliza ES Modules e integrações externas.

## Configuração do Firebase

A configuração do Firebase está localizada em:

```text
src/config/firebase.js
```

Para utilizar outro projeto Firebase:

1. Crie um projeto no Firebase Console;
2. Ative o Firebase Authentication;
3. Ative o provedor de e-mail e senha;
4. Crie um banco Firestore;
5. Cadastre uma aplicação Web;
6. Substitua a configuração presente em `firebase.js`;
7. Configure as regras de acesso do Firestore.

Para acessar a área administrativa, o documento correspondente em `usuarios` deve possuir:

```js
{
  role: "admin"
}
```

Usuários comuns devem manter `role: "cliente"`. As regras do Firestore devem impedir que um cliente altere a própria função ou execute operações administrativas.

> As chaves públicas de configuração do Firebase identificam a aplicação, mas a segurança dos dados deve ser garantida pelas regras do Authentication e do Firestore.

## Configuração do Cloudinary

O upload da foto de perfil utiliza o Cloudinary.

A configuração está em:

```text
src/services/cloudinaryService.js
```

É necessário configurar:

- Nome da conta Cloudinary;
- Upload preset;
- Permissões adequadas para upload.

O projeto envia apenas arquivos de imagem validados como JPG, PNG ou WebP, com limite de 5 MB. Em uma implantação pública, o upload preset deve limitar formatos, tamanho e origem dos envios.

## Pagamentos demonstrativos

O checkout não utiliza um gateway financeiro real. A identificação da bandeira serve apenas para feedback visual e os cartões exibidos no perfil são demonstrativos. Número completo, CVV e demais dados sensíveis não são persistidos pelo projeto.

O Pix também representa um fluxo acadêmico: o pedido é criado e confirmado sem comunicação com uma instituição financeira.

## Estados e feedback da interface

Os fluxos assíncronos apresentam estados explícitos de carregamento, sucesso, erro e conteúdo vazio. Mensagens globais utilizam regiões acessíveis (`role="status"`, `role="alert"` e `aria-live`), enquanto botões de envio ficam desabilitados durante operações para evitar duplicidade.

Utilitários compartilhados em `src/assets/js/utils` concentram:

- Feedback global e feedback após navegação;
- Estados de formulários;
- Pesquisa de cabeçalho e reconhecimento de voz;
- Debounce de busca e consultas;
- Otimização de imagens dinâmicas;
- Preferências e promoção de primeira compra.

As imagens não prioritárias recebem carregamento tardio e decodificação assíncrona, inclusive quando são adicionadas ao DOM depois do carregamento inicial.

## Responsividade

As páginas foram planejadas para funcionar nas principais larguras exigidas pelo projeto:

- Mobile: a partir de 360 px;
- Tablet: aproximadamente 768 px;
- Desktop: 1280 px ou superior.

Foram criados ajustes responsivos para:

- Header;
- Busca;
- Catálogo;
- Carrinho;
- Checkout;
- Formulários;
- Perfil;
- Modais;
- Páginas de status;
- Área administrativa;
- Rodapé.

## Acessibilidade

O projeto foi desenvolvido considerando os critérios verificáveis da WCAG 2.1 AA, incluindo:

- `lang="pt-BR"`;
- HTML semântico;
- Navegação por teclado;
- Foco visível;
- Labels associados;
- Mensagens com `aria-live`;
- Descrições acessíveis para botões;
- Imagens decorativas ocultadas de leitores de tela;
- Imagens significativas com texto alternativo;
- Preferências de leitura persistentes;
- Responsividade durante o aumento dos textos.

### Lighthouse

Os testes de acessibilidade devem ser executados:

1. Em uma janela anônima do Chrome;
2. Sem extensões;
3. No modo Desktop;
4. Apenas na categoria Acessibilidade;
5. Três vezes por página;
6. Considerando a mediana dos resultados.

Os resultados devem ser registrados no arquivo:

```text
lighthouse-report.md
```

## Fluxo principal

```text
Cadastro/Login
      ↓
Catálogo e busca
      ↓
Detalhes do produto
      ↓
Carrinho
      ↓
Endereço e pagamento
      ↓
Finalização do pedido
      ↓
Confirmação
```

## Integrantes

| Integrante                  | Função principal |
| --------------------------- | ---------------- |
| Gabriela Benfica Ricci      | UX               |
| Giulia Monteiro Manara      | Front-end        |
| João Vitor Maldonado Ianoni | Front-end        |
| Lucas Lima de Oliveira      | Back-end         |


> Apesar da divisão de responsabilidades, todos os integrantes devem conhecer e conseguir explicar o funcionamento geral do projeto.

## Uso de inteligência artificial

Ferramentas de inteligência artificial foram utilizadas como apoio durante o desenvolvimento.

O apoio incluiu:

- Revisão e organização de código;
- Sugestões de semântica e acessibilidade;
- Ajustes de responsividade;
- Desenvolvimento e refinamento da página de perfil;
- Estruturação visual da área administrativa;
- Identificação de possíveis erros;
- Apoio na documentação do projeto.

Todo código sugerido por IA foi revisado, adaptado e integrado pelos integrantes. A equipe permanece responsável pelas decisões técnicas e pelo entendimento integral da implementação.

Não foram adicionadas instruções ocultas, textos invisíveis ou mecanismos destinados a interferir em ferramentas automatizadas de avaliação.

## Limitações conhecidas

- Não existe gateway de pagamento real;
- Os cartões apresentados no checkout e no perfil são demonstrativos e nenhum número completo ou CVV é persistido;
- Algumas integrações dependem de serviços externos e de conexão com a internet;
- Testes automatizados ainda não foram implementados;
- O projeto possui finalidade acadêmica e não está preparado para operação comercial.

## Melhorias futuras

- Criar testes automatizados;
- Executar auditorias Lighthouse e axe;
- Melhorar as regras de segurança do Firestore;
- Adicionar monitoramento de falhas dos serviços externos;
- Evoluir a simulação de pagamento para um ambiente sandbox de gateway.

## Entrega acadêmica

O projeto foi desenvolvido para a disciplina de Desenvolvimento de Aplicações Dinâmicas.

Entregáveis relacionados:

- Repositório público no GitHub;
- MVP funcional;
- README completo;
- Relatório do Lighthouse;
- Roteiro do pitch;
- Tag de apresentação, como `v1.0-pitch`;
- Demonstração ao vivo.

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais informações.
