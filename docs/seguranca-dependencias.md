# Segurança das dependências — 08/11/2026

Consultas executadas com `composer audit --locked --format=json` e `npm audit --json`. São avisos de versões de dependências, não evidência de exploração do PetSystem. Os comandos de atualização não executaram scripts de instalação ou migrations. Foram preservadas as restrições de versões principais em `composer.json` e `package.json`.

## Correções direcionadas

| Pacote | Antes | Depois |
| --- | --- | --- |
| laravel/framework | 12.66.0 | 12.71.0 |
| league/commonmark | 2.9.2 | 2.10.7 |
| league/flysystem | 3.35.2 | 3.36.0 |
| symfony/http-foundation | 7.4.16 | 7.4.23 |
| symfony/http-kernel | 7.4.16 | 7.4.23 |
| symfony/mime | 7.4.16 | 7.4.22 |
| symfony/routing | 7.4.15 | 7.4.23 |
| symfony/yaml | 7.4.15 | 7.4.23 |
| axios | 1.19.0 | 1.21.0 |
| follow-redirects | 1.16.0 | 1.16.3 |
| source-map-js | 1.2.1 | 1.2.2 |
| vite | 6.4.3 | 6.4.5 |
| react-router / react-router-dom | 6.30.4 | 6.30.6 |

O lockfile registra as versões exatas e as demais alterações transitivas necessárias. A auditoria final do Composer não encontrou avisos nem pacotes abandonados. O npm ficou com **dois pacotes sinalizados como moderados**, sem avisos altos ou críticos: `react-router` e `react-router-dom` (este por depender do primeiro).

## Pendência: React Router

O npm reporta estes avisos para React Router 6.30.6:

- [Redirecionamento externo com barra invertida em Link/useNavigate — GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6).
- [Injeção de construtor em hidratação SSR — GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg).

A correção indicada pelo npm é `react-router-dom` 7.18.5, marcada como mudança de versão principal. Não foi aplicado `npm audit fix --force`. A aplicação usa `BrowserRouter` em SPA, sem hidratação SSR, e os destinos de navegação revisados são internos, construídos com rotas fixas, IDs e datas. Isso reduz a exposição aparente nesses fluxos, mas não equivale a correção da biblioteca nem encerra o aviso de redirecionamento.

Antes da release, revisar a migração direcionada à versão corrigida, validar navegação e autenticação no navegador e repetir testes/build/auditoria. A [documentação oficial de mudanças](https://reactrouter.com/changelog) descreve requisitos e mudanças de comportamento da versão 7. O parecer de segurança final permanece pendente; esta auditoria não substitui análise da hospedagem.
