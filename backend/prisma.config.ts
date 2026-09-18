import 'dotenv/config'
import { defineConfig } from '@prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
    // Nao configuramos `shadowDatabaseUrl` com a DIRECT_URL: o Prisma DROPA e
    // recria o banco de shadow, e a DIRECT_URL aponta para o banco real. As
    // migrations sao escritas a mao e aplicadas com `migrate deploy`, que nao
    // precisa de shadow database.
  },
})
