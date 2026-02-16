import { jest } from "@jest/globals";
import path from "path";

const setupModule = async (saveResult) => {
  jest.resetModules();

  const mockWriteFile = jest.fn();
  const mockPrintToPDF = jest.fn().mockResolvedValue(Buffer.from("pdf"));
  const mockLoadURL = jest.fn();
  const mockWindowInstance = {
    loadURL: mockLoadURL,
    webContents: { printToPDF: mockPrintToPDF },
    close: jest.fn(),
  };
  const mockBrowserWindow = jest.fn(() => mockWindowInstance);
  const mockDialog = {
    showSaveDialog: jest.fn().mockResolvedValue(saveResult),
  };
  const mockApp = {
    getPath: jest.fn(() => "/tmp"),
  };

  await jest.unstable_mockModule("electron", () => ({
    app: mockApp,
    BrowserWindow: mockBrowserWindow,
    dialog: mockDialog,
  }));

  await jest.unstable_mockModule("fs/promises", () => ({
    writeFile: mockWriteFile,
  }));

  const module = await import("../utils/summaryExport.js");

  return {
    module,
    mockWriteFile,
    mockPrintToPDF,
    mockLoadURL,
    mockBrowserWindow,
    mockDialog,
    mockApp,
  };
};

describe("exportSessionSummaryPdf", () => {
  test("returns canceled when save dialog is dismissed", async () => {
    const { module, mockWriteFile, mockBrowserWindow } = await setupModule({
      canceled: true,
    });

    const result = await module.exportSessionSummaryPdf({
      summaryText: "Summary",
    });

    expect(result).toEqual({ canceled: true });
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockBrowserWindow).not.toHaveBeenCalled();
  });

  test("writes pdf when dialog provides a file path", async () => {
    const { module, mockWriteFile, mockPrintToPDF, mockDialog, mockLoadURL } =
      await setupModule({
        canceled: false,
        filePath: "/tmp/session-summary.pdf",
      });

    const result = await module.exportSessionSummaryPdf({
      summaryText: "Summary",
      scenarioName: "Case Alpha",
      sessionId: 12,
      userName: "Demo User",
      fileName: "Custom Name.pdf",
    });

    expect(mockDialog.showSaveDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Save Session Summary",
        defaultPath: path.join("/tmp", "Custom_Name.pdf"),
      })
    );
    expect(mockLoadURL).toHaveBeenCalledTimes(1);
    expect(mockPrintToPDF).toHaveBeenCalledWith({
      printBackground: true,
      pageSize: "A4",
    });
    expect(mockWriteFile).toHaveBeenCalledWith(
      "/tmp/session-summary.pdf",
      expect.any(Buffer)
    );
    expect(result).toEqual({
      success: true,
      filePath: "/tmp/session-summary.pdf",
    });
  });

  test("throws when summary text is missing", async () => {
    const { module } = await setupModule({
      canceled: false,
      filePath: "/tmp/session-summary.pdf",
    });

    await expect(
      module.exportSessionSummaryPdf({ summaryText: "   " })
    ).rejects.toThrow("summaryText is required");
  });
});
