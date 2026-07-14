import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { hash, compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { DEFAULT_CATEGORIES } from '@/lib/default-categories'

// Schema de validação para o Cadastro
const cadastroBodySchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
})

// Schema de validação para o Login
const loginBodySchema = z.object({
  email: z.string().email(),
  senha: z.string(),
})

export async function cadastro(request: FastifyRequest, reply: FastifyReply) {
  const { nome, email, senha } = cadastroBodySchema.parse(request.body)

  // Verifica se o usuário já existe
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  })

  if (usuarioExistente) {
    return reply.status(400).send({ message: 'E-mail já cadastrado.' })
  }

  // Criptografa a senha
  const senhaHash = await hash(senha, 6)

  // Cria o usuário no banco Neon
  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaHash,
    },
  })

  // Cria as categorias padrão para o novo usuário
  const categoriasDoUsuario = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    usuarioId: usuario.id,
  }))

  await prisma.categoria.createMany({
    data: categoriasDoUsuario,
  })

  // Gera o token JWT
  const token = await reply.jwtSign({}, { sign: { sub: usuario.id } })

  // Define o Cookie HTTP-Only para a Web
  reply.setCookie('token', token, {
    path: '/',
    secure: true, // Requer HTTPS (na Render rodará nativo)
    httpOnly: true, // Impede leitura via scripts no front (proteção XSS)
    sameSite: 'lax',
  })

  // Retorna HTTP 201 com o Token e dados (conforme o contrato do MVP)
  return reply.status(201).send({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
  })
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, senha } = loginBodySchema.parse(request.body)

  // Busca o usuário
  const usuario = await prisma.usuario.findUnique({
    where: { email },
  })

  if (!usuario || !usuario.senha) {
    return reply.status(400).send({ message: 'Credenciais inválidas.' })
  }

  // Valida a senha
  const senhaBate = await compare(senha, usuario.senha)

  if (!senhaBate) {
    return reply.status(400).send({ message: 'Credenciais inválidas.' })
  }

  // Gera o token JWT
  const token = await reply.jwtSign({}, { sign: { sub: usuario.id } })

  // Define o Cookie HTTP-Only para a Web
  reply.setCookie('token', token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  })

  return reply.status(200).send({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
  })
}