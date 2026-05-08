import { expect, test } from '@playwright/test'
import path from 'path'

test.describe('이미지 업로드 OCR', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('페이지 제목이 표시된다', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('이미지 OCR')
  })

  test('드롭존이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('dropzone')).toBeVisible()
  })

  test('네비게이션 링크가 표시된다', async ({ page }) => {
    await expect(page.getByText('이미지 업로드')).toBeVisible()
    await expect(page.getByText('카메라')).toBeVisible()
  })

  test('카메라 페이지로 이동한다', async ({ page }) => {
    await page.getByText('카메라').click()
    await expect(page).toHaveURL('/camera')
    await expect(page.locator('h1')).toContainText('카메라 OCR')
  })
})
