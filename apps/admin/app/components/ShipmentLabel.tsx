'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';

export interface ShipmentLabelData {
  trackingNumber: string;
  originCountry: string;       // e.g. 'PAK'
  destinationCountry: string;  // e.g. 'AUS'
  pieces: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  declaredValueUsd: number;
  contentType: string;         // e.g. 'Non-Doc'
  description: string;         // e.g. 'CLOTHES'
  sender: {
    name: string;
    addressLines: string[];
    phone: string;
  };
  receiver: {
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
  };
  orderCreationDate: string;
}

export default function ShipmentLabel({ data }: { data: ShipmentLabelData }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, data.trackingNumber, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 14,
        height: 55,
        margin: 0,
      });
    }
  }, [data.trackingNumber]);

  const printDate = new Date().toLocaleDateString('en-US');

  return (
    <div>
      <div className="no-print flex justify-center py-4">
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer size={16} />
          Print Label
        </button>
      </div>

      <div id="shipment-label" className="mx-auto max-w-3xl border border-gray-300 bg-white text-black text-sm">
        <div className="grid grid-cols-[1fr_2fr_1fr] border-b border-gray-300">
          <div className="flex items-center justify-center p-3 font-bold">Impeccable Courier</div>
          <div className="flex flex-col items-center justify-center p-3 border-l border-r border-gray-300">
            <div className="font-bold text-lg">Impeccable Courier</div>
            <div className="text-xs text-gray-600">Impeccable Courier Pvt. Ltd</div>
          </div>
          <div className="flex flex-col items-center justify-center p-3 text-xs text-gray-600">
            <div>www.impeccablecourier.com.au</div>
            <div>www.impeccablecourier.com.pk</div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-300">
          <div className="p-4 border-r border-gray-300">
            <div className="font-bold mb-2">ORIGIN: [ {data.originCountry} ]</div>
            <div className="flex justify-center">
              <svg ref={barcodeRef} />
            </div>
          </div>
          <div className="p-4 space-y-1">
            <div><span className="font-bold">DESTINATION:</span> [ {data.destinationCountry} ]</div>
            <div>NO OF PIECES/PARCEL: {data.pieces}</div>
            <div>WEIGHT: {data.actualWeightKg.toFixed(2)} KG / {data.volumetricWeightKg.toFixed(2)} KG</div>
            <div>DECLARED VALUE: {data.declaredValueUsd.toFixed(2)} USD</div>
            <div>CONTENT: {data.contentType}</div>
          </div>
        </div>

        <div className="p-3 border-b border-gray-300 font-bold">
          Description of Goods: {data.description}
        </div>

        <div className="grid grid-cols-2 border-b border-gray-300">
          <div className="p-4 border-r border-gray-300">
            <div className="font-bold mb-1">Sender:</div>
            <div>{data.sender.name}</div>
            {data.sender.addressLines.map((line, i) => <div key={i}>{line}</div>)}
            <div>{data.sender.phone}</div>
          </div>
          <div className="p-4">
            <div className="font-bold mb-1">Receiver:</div>
            <div>Name: {data.receiver.name}</div>
            <div>Address: {data.receiver.address}</div>
            <div>City: {data.receiver.city}</div>
            <div>Country: {data.receiver.country}</div>
            <div>Number: {data.receiver.phone}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 text-xs text-gray-600">
          <div className="p-3">PFN Print Date: {printDate}</div>
          <div className="p-3 text-right">Order Creation Date: {data.orderCreationDate}</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #shipment-label, #shipment-label * { visibility: visible; }
          #shipment-label { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}