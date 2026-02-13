/**
 * Tests for downloadFile utility
 */

import { downloadFile } from '@/utils/fileDownload';

describe('downloadFile', () => {
  let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> };
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockLink = { href: '', download: '', click: vi.fn() };
    createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockLink as unknown as HTMLElement);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an anchor element with correct attributes', () => {
    const blob = new Blob(['test content'], { type: 'text/plain' });

    downloadFile(blob, 'test.txt');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe('blob:mock-url');
    expect(mockLink.download).toBe('test.txt');
  });

  it('should trigger a click to start the download', () => {
    const blob = new Blob(['{}'], { type: 'application/json' });

    downloadFile(blob, 'data.json');

    expect(mockLink.click).toHaveBeenCalledOnce();
  });

  it('should create and revoke object URL', () => {
    const blob = new Blob(['<xml/>'], { type: 'application/xml' });

    downloadFile(blob, 'export.xml');

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should revoke URL after clicking', () => {
    const callOrder: string[] = [];
    mockLink.click = vi.fn(() => callOrder.push('click'));
    revokeObjectURLSpy.mockImplementation(() => callOrder.push('revoke'));

    const blob = new Blob(['data'], { type: 'text/plain' });
    downloadFile(blob, 'file.txt');

    expect(callOrder).toEqual(['click', 'revoke']);
  });

  it('should handle different blob types', () => {
    const xmlBlob = new Blob(['<diagram/>'], { type: 'application/xml' });
    downloadFile(xmlBlob, 'diagram.drawio');
    expect(mockLink.download).toBe('diagram.drawio');

    const jsonBlob = new Blob(['{}'], { type: 'application/json' });
    downloadFile(jsonBlob, 'snapshot.json');
    expect(mockLink.download).toBe('snapshot.json');
  });
});
