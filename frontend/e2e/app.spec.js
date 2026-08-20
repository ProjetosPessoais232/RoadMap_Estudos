import { expect, test } from '@playwright/test'

test('mostra a tela de login', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  await expect(page.getByText('Progresso, cursos e histórico da IA')).toBeVisible()
})

test('cadastra usuário e abre o canvas', async ({ page }) => {
  const email = `e2e.${Date.now()}@roadmap.test`
  await page.goto('/')
  await page.getByRole('button', { name: 'Não tem conta? Cadastre-se' }).click()
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha (mín. 6)').fill('senha123')
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page.getByRole('heading', { name: 'LMS de Estudos' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(email)).toBeVisible()
  await page.getByRole('button', { name: 'Chat de cursos' }).click()
  await expect(page.getByRole('heading', { name: 'Chat com a IA' })).toBeVisible()
})
