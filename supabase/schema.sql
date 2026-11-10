-- CITA-COOP — esquema inicial da base territorial (PostgreSQL + PostGIS).
-- Situação: PROJETO. Ainda não aplicado em nenhum banco; a aplicação e a carga fazem parte do TRL 5.
-- No TRL 4 a plataforma lê arquivos estáticos gerados por scripts/etl e guarda registros no navegador.

create extension if not exists postgis;

-- Territórios ---------------------------------------------------------------
create table if not exists municipio (
  cod_ibge        char(7) primary key,
  nome            text not null,
  uf              char(2) not null,
  ponto           geography(Point, 4326) not null,
  estab_total     integer,          -- Censo Agro 2017 (SIDRA 6778)
  estab_familiar  integer
);
create index if not exists municipio_ponto_idx on municipio using gist (ponto);

-- Cooperativas (CNPJ / Receita Federal) --------------------------------------
create table if not exists cooperativa (
  cnpj             char(14) primary key,
  razao_social     text not null,
  nome_fantasia    text,
  matriz           boolean not null,
  situacao         text not null,           -- ATIVA, BAIXADA, INAPTA, SUSPENSA, NULA
  data_situacao    date,
  data_inicio      date,
  cnae_principal   char(7),
  ramo_estimado    text,
  logradouro       text,
  bairro           text,
  cep              char(8),
  cod_ibge         char(7) references municipio,
  ponto            geography(Point, 4326),
  precisao_geo     text not null default 'municipio',  -- municipio | cep | endereco | validado
  caf_juridico     boolean,                              -- preenchido quando houver dado do MDA
  carga            char(7) not null                      -- AAAA-MM da carga do CNPJ
);
create index if not exists cooperativa_ponto_idx on cooperativa using gist (ponto);
create index if not exists cooperativa_mun_idx on cooperativa (cod_ibge) where situacao = 'ATIVA';

-- Catálogo de dados e cargas (governança) -------------------------------------
create table if not exists fonte_dados (
  id           text primary key,
  nome         text not null,
  orgao        text not null,
  acesso       text,
  linhagem     text,
  limitacoes   text
);
create table if not exists carga_dados (
  id           bigserial primary key,
  fonte        text not null references fonte_dados,
  referencia   text not null,
  executada_em timestamptz not null default now(),
  registros    integer,
  situacao     text not null
);

-- Registros dos usuários ------------------------------------------------------
create table if not exists demanda (
  id          uuid primary key default gen_random_uuid(),
  criada_em   timestamptz not null default now(),
  autor       uuid,                         -- auth.users
  cnpj        char(14) references cooperativa,
  cod_ibge    char(7) references municipio,
  titulo      text not null,
  texto       text not null,
  tema        text not null,
  prioridade  text not null default 'normal',
  etapa       text not null default 'nova'  -- nova | classificada | encaminhada | resolvida
);

create table if not exists diagnostico_imgc (
  id          uuid primary key default gen_random_uuid(),
  cnpj        char(14) not null references cooperativa,
  aplicado_em date not null default current_date,
  aplicador   uuid,
  respostas   jsonb not null,               -- { governanca: [0..4, ...], ... }
  nota_geral  numeric(5,1)
);

create table if not exists documento_regularidade (
  cnpj      char(14) not null references cooperativa,
  tipo      text not null,                  -- cnpj | caf | federal | fgts | trabalhista | ago | mandato
  validade  date,
  primary key (cnpj, tipo)
);

create table if not exists icpp_municipio (
  cod_ibge    char(7) not null references municipio,
  ano         integer not null,
  cadastro    numeric, credito numeric, ater numeric, pnae numeric, paa numeric, protecao numeric,
  icpp        numeric,
  primary key (cod_ibge, ano)
);

-- Segurança: dados individuais só para quem tem vínculo (LGPD) ------------------
alter table demanda enable row level security;
alter table diagnostico_imgc enable row level security;
alter table documento_regularidade enable row level security;
-- As políticas de acesso por perfil serão criadas junto com a autenticação (TRL 5).
