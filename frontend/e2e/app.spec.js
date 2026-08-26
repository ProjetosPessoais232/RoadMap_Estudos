import { expect, test } from '@playwright/test'

test('mostra a página inicial', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Seu roadmap/ })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Começar agora' }).first()).toBeVisible()
})

test('cadastra usuário e abre o canvas', async ({ page }) => {
  const email = `e2e.${Date.now()}@roadmap.test`
  await page.goto('/')
  await page.getByRole('button', { name: 'Começar agora' }).first().click()
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha (mín. 6)').fill('senha123')
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page.locator('[aria-label="Paperless"]')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(email)).toBeVisible()
  await page.getByRole('button', { name: 'Chat de cursos' }).click()
  await expect(page.getByText('Mentor de cursos')).toBeVisible()
  await page.getByRole('button', { name: 'Summary' }).click()
  await expect(page.getByText('Caderno')).toBeVisible()
})
