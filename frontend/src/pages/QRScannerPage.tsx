import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import { QrCode, Smartphone, Camera, AlertCircle } from 'lucide-react'
import { QRScanner } from '../components/QRScanner'
import api from '../lib/api'

export default function QRScannerPage() {
    const navigate = useNavigate()
    const [showScanner, setShowScanner] = useState(false)
    const [scannedData, setScannedData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleScan = async (result: string) => {
        try {
            // Parse the scanned QR code data
            const data = JSON.parse(result)
            setScannedData(data)

            // Navigate to the device detail page
            if (data.deviceId) {
                navigate(`/devices/${data.deviceId}`)
            }
        } catch (err) {
            console.error('Scan error:', err)
            setError('Invalid QR code format')
        }
    }

    const handleClose = () => {
        setShowScanner(false)
        setScannedData(null)
        setError(null)
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">QR Scanner</h2>
                    <p className="text-muted-foreground">Scan device QR codes for quick access</p>
                </div>
                <QrCode className="h-8 w-8 text-primary" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Scan Device QR Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <Smartphone className="h-16 w-16 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                            Point your camera at a device QR code to quickly access its information
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {scannedData && (
                        <Alert>
                            <AlertDescription>
                                <div className="space-y-1">
                                    <div className="font-medium">Scanned Device:</div>
                                    <div>Name: {scannedData.name}</div>
                                    <div>Serial: {scannedData.serial}</div>
                                    <div>ID: {scannedData.deviceId}</div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-center">
                        <Button onClick={() => setShowScanner(true)} size="lg">
                            <Camera className="mr-2 h-5 w-5" />
                            Scan QR Code
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showScanner && (
                <QRScanner onScan={handleScan} onClose={handleClose} />
            )}
        </div>
    )
}
