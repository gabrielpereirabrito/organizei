import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { hash, compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { DEFAULT_CATEGORIES } from '@/lib/default-categories'

// Schema de validação para o Cadastro
const cadastroBodySchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  // 8 caracteres é o piso para um app que guarda dados financeiros pessoais;
  // o login continua aceitando senhas antigas mais curtas (ver loginBodySchema).
  senha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
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
    return reply.status(409).send({ message: 'E-mail já cadastrado.' })
  }

  // Criptografa a senha
  const senhaHash = await hash(senha, 6)

  // Usuário e categorias padrão nascem juntos ou não nascem: fora de uma
  // transação, uma falha na segunda etapa deixaria o usuário sem categoria
  // alguma. O `create` aninhado (em vez de `createMany`) é o que permite criar
  // as subcategorias sem precisar dos ids das categorias de antemão.
  const usuario = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const novoUsuario = await tx.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
      },
    })

    for (const { subcategorias, ...categoria } of DEFAULT_CATEGORIES) {
      await tx.categoria.create({
        data: {
          ...categoria,
          usuarioId: novoUsuario.id,
          subcategorias: {
            create: subcategorias.map((nomeSub) => ({
              nome: nomeSub,
              usuarioId: novoUsuario.id,
            })),
          },
        },
      })
    }

    return novoUsuario
  })

  // Gera os tokens JWT
  const token = await reply.jwtSign({}, { sign: { sub: usuario.id, expiresIn: '15m' } })
  const refreshToken = await reply.jwtSign(
    {},
    { sign: { sub: usuario.id, expiresIn: '7d' } },
  )

  // Define os Cookies HTTP-Only para a Web
  reply.setCookie('token', token, {
    path: '/',
    secure: true, // Requer HTTPS (na Render rodará nativo)
    httpOnly: true, // Impede leitura via scripts no front (proteção XSS)
    sameSite: 'lax',
  })

  reply.setCookie('refreshToken', refreshToken, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  })

  // Retorna HTTP 201 com o Token e dados (conforme o contrato do MVP)
  return reply.status(201).send({
    token,
    refreshToken,
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

  if (!usuario) {
    return reply.status(404).send({ message: 'Usuário não encontrado com este e-mail.' })
  }

  if (!usuario.senha) {
    return reply.status(400).send({
      message:
        'Este usuário foi cadastrado via provedor externo (ex: Google) e não possui senha.',
    })
  }

  // Valida a senha
  const senhaBate = await compare(senha, usuario.senha)

  if (!senhaBate) {
    return reply.status(401).send({ message: 'Senha incorreta.' })
  }

  // Gera os tokens JWT
  const token = await reply.jwtSign({}, { sign: { sub: usuario.id, expiresIn: '15m' } })
  const refreshToken = await reply.jwtSign(
    {},
    { sign: { sub: usuario.id, expiresIn: '7d' } },
  )

  // Define os Cookies HTTP-Only para a Web
  reply.setCookie('token', token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  })

  reply.setCookie('refreshToken', refreshToken, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  })

  return reply.status(200).send({
    token,
    refreshToken,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
  })
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const refreshToken =
    request.cookies.refreshToken || (request.headers['x-refresh-token'] as string)

  if (!refreshToken) {
    return reply.status(401).send({ message: 'Refresh token não fornecido.' })
  }

  try {
    const decoded = request.server.jwt.verify<{ sub: string }>(refreshToken)
    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.sub } })

    if (!usuario) {
      return reply.status(401).send({ message: 'Usuário não encontrado.' })
    }

    const newToken = await reply.jwtSign(
      {},
      { sign: { sub: usuario.id, expiresIn: '15m' } },
    )
    const newRefreshToken = await reply.jwtSign(
      {},
      { sign: { sub: usuario.id, expiresIn: '7d' } },
    )

    reply.setCookie('token', newToken, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    })

    reply.setCookie('refreshToken', newRefreshToken, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    })

    return reply.status(200).send({
      token: newToken,
      refreshToken: newRefreshToken,
    })
  } catch {
    return reply.status(401).send({ message: 'Refresh token inválido ou expirado.' })
  }
}
