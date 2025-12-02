import { en } from '@shared/constants/i18n/languages/en';
import { ko } from '@shared/constants/i18n/languages/ko';
import { ja } from '@shared/constants/i18n/languages/ja';

describe('Language value sanity checks', () => {
  it('english language object should contain expected toolbar values', () => {
    expect(en.toolbar.previous).toBe('Previous');
    expect(en.toolbar.next).toBe('Next');
    expect(en.settings.language).toBe('Language');
    // Deep nested values
    expect(en.messages.download.single.error.title).toBe('Download Failed');
    expect(en.messages.download.single.error.body).toContain('Could not download the file');
    expect(en.messages.download.allFailed.title).toBe('Download Failed');
    expect(en.messages.download.partial.title).toBe('Partial Failure');
    expect(en.messages.download.retry.success.title).toBe('Retry Successful');
    expect(en.messages.download.cancelled.title).toBe('Download Cancelled');
    expect(en.messages.gallery.emptyTitle).toBe('No media available');
    expect(en.messages.gallery.emptyDescription).toBe('There are no images or videos to display.');
  });

  it('korean language object should contain expected toolbar values', () => {
    expect(ko.toolbar.previous).toBe('이전');
    expect(ko.toolbar.next).toBe('다음');
    expect(ko.settings.language).toBe('언어');
    // Deep nested values
    expect(ko.messages.download.single.error.title).toBe('다운로드 실패');
    expect(ko.messages.download.single.error.body).toContain('파일을 가져올 수 없습니다');
    expect(ko.messages.download.partial.title).toBe('일부 실패');
    expect(ko.messages.download.allFailed.title).toBe('다운로드 실패');
    expect(ko.messages.gallery.emptyTitle).toBe('미디어 없음');
  });

  it('japanese language object should contain expected toolbar values', () => {
    expect(ja.toolbar.previous).toBe('前へ');
    expect(ja.toolbar.next).toBe('次へ');
    expect(ja.settings.language).toBe('言語');
    // Deep nested values
    expect(ja.messages.download.single.error.title).toBe('ダウンロード失敗');
    expect(ja.messages.download.single.error.body).toContain('ファイルを取得できません');
    expect(ja.messages.download.allFailed.title).toBe('ダウンロード失敗');
    expect(ja.messages.gallery.emptyTitle).toBe('メディアがありません');
  });
});
