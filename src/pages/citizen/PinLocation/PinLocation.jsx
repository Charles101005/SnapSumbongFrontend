import React, { useState } from "react";
import "./PinLocation.css";


export default function PinLocationPage({ initialLocation, onConfirm, onBack }) {
 const [address, setAddress] = useState(
   initialLocation?.address || "Rizal Park, Ermita, Manila, 1000 Metro Manila"
 );
 const [isEditingAddress, setIsEditingAddress] = useState(false);
 const [zoomLevel, setZoomLevel] = useState(1);


 const handleZoomIn = () => {
   setZoomLevel((prev) => Math.min(prev + 0.2, 2));
 };


 const handleZoomOut = () => {
   setZoomLevel((prev) => Math.max(prev - 0.2, 0.8));
 };


 const handleConfirm = () => {
   onConfirm({
     ...initialLocation,
     address: address,
   });
 };


 return (
   <div className="pin-location-container">
     {/* Title & Subtitle */}
     <header className="pin-header">
       <h2>Pin the Location</h2>
       <p>Drag the map or use your GPS to pinpoint the hazard.</p>
     </header>


     {/* Interactive Map Wrapper */}
     <div className="pin-map-card">
       <div className="pin-map-viewport">
         {/* Simulated Map Background */}
         <div
           className="pin-map-bg"
           style={{ transform: `scale(${zoomLevel})` }}
         >
           <svg
             viewBox="0 0 950 450"
             preserveAspectRatio="xMidYMid slice"
             className="map-vector"
           >
             {/* Land / Water Base */}
             <rect width="950" height="450" fill="#a4c2db" />
             <polygon
               points="180,0 950,0 950,450 350,450 220,280 260,180"
               fill="#cfdeca"
             />


             {/* Road Grids */}
             <g stroke="#ffffff" strokeWidth="5" fill="none" opacity="0.8">
               <line x1="200" y1="50" x2="950" y2="50" />
               <line x1="250" y1="120" x2="950" y2="120" />
               <line x1="280" y1="220" x2="950" y2="220" />
               <line x1="360" y1="330" x2="950" y2="330" />
               <line x1="300" y1="0" x2="300" y2="450" />
               <line x1="450" y1="0" x2="450" y2="450" />
               <line x1="620" y1="0" x2="620" y2="450" />
               <line x1="800" y1="0" x2="800" y2="450" />
             </g>


             {/* Major Highways */}
             <g stroke="#f6d365" strokeWidth="8" fill="none">
               <path d="M 220,280 C 400,250 500,100 850,50" />
               <path d="M 350,450 C 450,300 600,200 620,0" />
             </g>


             {/* Landmarks / Labels */}
             <text x="520" y="160" className="map-label city-label">
               Manila
             </text>
             <text x="390" y="210" className="map-label sub-label">
               Rizal Park
             </text>
             <text x="680" y="140" className="map-label sub-label">
               Greenhills
             </text>
             <text x="740" y="310" className="map-label sub-label">
               Makati City
             </text>
             <text x="500" y="400" className="map-label sub-label">
               Pasay City
             </text>
           </svg>
         </div>


         {/* Center Location Pin */}
         <div className="pin-marker">
           <svg
             viewBox="0 0 24 24"
             fill="#2563eb"
             stroke="#ffffff"
             strokeWidth="1.5"
           >
             <path d="M12 0C7.6 0 4 3.6 4 8c0 6 8 16 8 16s8-10 8-16c0-4.4-3.6-8-8-8Z" />
             <circle cx="12" cy="8" r="3" fill="#ffffff" />
           </svg>
         </div>


         {/* Map Controls */}
         <div className="zoom-controls">
           <button
             type="button"
             className="zoom-btn"
             onClick={handleZoomIn}
             title="Zoom In"
           >
             +
           </button>
           <button
             type="button"
             className="zoom-btn"
             onClick={handleZoomOut}
             title="Zoom Out"
           >
             &minus;
           </button>
         </div>
       </div>
     </div>


     {/* Selected Location Details Card */}
     <div className="location-card">
       <div className="location-icon">
         <svg
           viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           strokeWidth="2"
           strokeLinecap="round"
           strokeLinejoin="round"
         >
           <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
           <line x1="9" y1="3" x2="9" y2="18" />
           <line x1="15" y1="6" x2="15" y2="21" />
         </svg>
       </div>


       <div className="location-details">
         <span className="location-label">SELECTED LOCATION</span>
         {isEditingAddress ? (
           <input
             type="text"
             className="location-input"
             value={address}
             onChange={(e) => setAddress(e.target.value)}
             onBlur={() => setIsEditingAddress(false)}
             autoFocus
           />
         ) : (
           <div className="location-address">{address}</div>
         )}
       </div>


       <button
         type="button"
         className="btn-edit-address"
         onClick={() => setIsEditingAddress(!isEditingAddress)}
       >
         {isEditingAddress ? "Done" : "Edit Address"}
       </button>
     </div>


     {/* Bottom Actions */}
     <div className="pin-actions">
       <button type="button" className="btn-back" onClick={onBack}>
         <svg
           viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           strokeWidth="2"
           strokeLinecap="round"
           strokeLinejoin="round"
         >
           <line x1="19" y1="12" x2="5" y2="12" />
           <polyline points="12 19 5 12 12 5" />
         </svg>
         Back
       </button>


       <button type="button" className="btn-confirm" onClick={handleConfirm}>
         Confirm
       </button>
     </div>
   </div>
 );
}

