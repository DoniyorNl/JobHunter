/**
 * PDF Export — html2canvas + jsPDF approach.
 *
 * Why html2canvas + jsPDF instead of @react-pdf/renderer?
 * - Our templates are HTML/CSS — re-implementing them in react-pdf's JSX
 *   would be duplicate work with subtle rendering differences.
 * - html2canvas captures the exact visual output that the user sees in the
 *   preview, so the PDF matches the preview 1:1.
 * - The 2-3s generation time is acceptable for an explicit "Download PDF" action.
 *
 * Why NOT window.print()?
 * - No control over margins, headers, footers.
 * - Users need to manually configure print settings.
 * - Can't programmatically trigger download.
 */
export async function exportToPDF(elementId: string, filename: string): Promise<void> {
	// Dynamic imports keep the bundle small — these libs are only loaded when
	// the user actually clicks "Export PDF", not on initial page load.
	const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
		import('html2canvas'),
		import('jspdf'),
	])

	const element = document.getElementById(elementId)
	if (!element) throw new Error(`Element #${elementId} not found`)

	// Render at 2× resolution for crisp text on high-DPI screens
	const canvas = await html2canvas(element, {
		scale: 2,
		useCORS: true,
		logging: false,
		backgroundColor: '#ffffff',
		// Prevent scrollbar / overflow issues during capture
		windowWidth: element.scrollWidth,
		windowHeight: element.scrollHeight,
	})

	// A4 dimensions in mm at 72dpi (jsPDF default unit)
	const PDF_WIDTH = 210
	const PDF_HEIGHT = 297

	const imgData = canvas.toDataURL('image/jpeg', 0.95)

	// Calculate image dimensions to fit A4 exactly
	const imgWidthMM = PDF_WIDTH
	const imgHeightMM = (canvas.height / canvas.width) * PDF_WIDTH

	const pdf = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4',
	})

	// If content is taller than one page, add additional pages
	let yOffset = 0
	while (yOffset < imgHeightMM) {
		if (yOffset > 0) pdf.addPage()

		pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgWidthMM, imgHeightMM)
		yOffset += PDF_HEIGHT
	}

	pdf.save(`${filename}.pdf`)
}
