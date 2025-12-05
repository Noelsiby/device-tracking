import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Camera, X } from 'lucide-react'

interface QRScannerProps {
    onScan: (result: string) => void
    onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const [error, setError] = useState<string | null>(null)

    const startScanning = async () => {
        try {
            setError(null)
            const scanner = new Html5Qrcode('qr-reader')
            scannerRef.current = scanner

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    onScan(decodedText)
                    stopScanning()
                },
                () => {
                    // Ignore scan errors (happens continuously while scanning)
                }
            )
            setIsScanning(true)
        } catch (err: any) {
            setError(err.message || 'Failed to start camera')
            console.error('QR Scanner error:', err)
        }
    }

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop()
                scannerRef.current.clear()
            } catch (err) {
                console.error('Error stopping scanner:', err)
            }
            setIsScanning(false)
        }
    }

    useEffect(() => {
        return () => {
            stopScanning()
        }
    }, [])

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Scan QR Code</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => { stopScanning(); onClose(); }}>
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}
                    {!isScanning && !error && (
                        <Button onClick={startScanning} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            Start Camera
                        </Button>
                    )}
                    {isScanning && (
                        <div className="text-sm text-center text-muted-foreground">
                            Position the QR code within the frame
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
