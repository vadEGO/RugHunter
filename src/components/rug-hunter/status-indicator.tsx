"use client";

import type { LucideIcon } from 'lucide-react';
import { CheckCircle, AlertTriangle, ShieldQuestion, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type StatusDisplayType = 'safe' | 'rugged' | 'checking' | 'error' | 'idle';

interface StatusIndicatorProps {
  status: StatusDisplayType;
  address?: string;
  message?: string;
}

export function StatusIndicator({ status, address, message }: StatusIndicatorProps) {
  let Icon: LucideIcon | null = null;
  let iconColorClass = '';
  let textColorClass = '';
  let statusMessage = '';
  let title = "Wallet Status";

  switch (status) {
    case 'safe':
      Icon = CheckCircle;
      iconColorClass = 'text-green-500';
      textColorClass = 'text-green-600 font-semibold';
      statusMessage = address ? `Address ${address.substring(0,6)}...${address.substring(address.length-4)} appears to be SAFE.` : 'Address is likely SAFE.';
      title = "Safe Address";
      break;
    case 'rugged':
      Icon = AlertTriangle;
      iconColorClass = 'text-red-500'; // Using theme accent for scam
      textColorClass = 'text-red-600 font-semibold';
      statusMessage = address ? `Warning! Address ${address.substring(0,6)}...${address.substring(address.length-4)} is a KNOWN SCAM!` : 'Warning! KNOWN SCAM ADDRESS!';
      title = "Scam Alert!";
      break;
    case 'checking':
      Icon = Loader2;
      iconColorClass = 'text-primary animate-spin';
      textColorClass = 'text-muted-foreground';
      statusMessage = 'Checking address...';
      title = "Checking...";
      break;
    case 'error':
      Icon = XCircle;
      iconColorClass = 'text-destructive';
      textColorClass = 'text-destructive font-semibold';
      statusMessage = message || 'An error occurred.';
      title = "Error";
      break;
    case 'idle':
    default:
      Icon = ShieldQuestion;
      iconColorClass = 'text-muted-foreground';
      textColorClass = 'text-muted-foreground';
      statusMessage = 'Enter an address above to check its status.';
      title = "Check Wallet Status";
      // No specific address or detailed message for idle
      break;
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center p-6">
        {Icon && <Icon className={`h-20 w-20 mb-6 ${iconColorClass}`} strokeWidth={1.5} />}
        <p className={`text-lg ${textColorClass}`}>{statusMessage}</p>
        {message && status !== 'error' && status !== 'idle' && <p className="text-sm text-muted-foreground mt-2">{message}</p>}
      </CardContent>
    </Card>
  );
}
