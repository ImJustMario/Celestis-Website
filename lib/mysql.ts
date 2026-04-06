import mysql from 'mysql2/promise'

declare global {
  // Reuse the pool across hot reloads in development.
  // eslint-disable-next-line no-var
  var __celestisMysqlPool: mysql.Pool | undefined
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getMysqlPool() {
  if (!global.__celestisMysqlPool) {
    global.__celestisMysqlPool = mysql.createPool({
      host: getRequiredEnv('MYSQL_HOST'),
      user: getRequiredEnv('MYSQL_USER'),
      password: getRequiredEnv('MYSQL_PASSWORD'),
      database: getRequiredEnv('MYSQL_DATABASE'),
      port: Number(process.env.MYSQL_PORT ?? 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }

  return global.__celestisMysqlPool
}
