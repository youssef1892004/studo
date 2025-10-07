import React, { useEffect, useState } from "react";

   type LinkItem = { id: string; projectid: string; project_link: string };

   export default function GeneratedLinks({ projectId }: { projectId: string }) {
     const [links, setLinks] = useState<LinkItem[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     const fetchLinks = async () => {
       try {
         console.log(`[GeneratedLinks] Fetching for projectId: ${projectId}`);
         setLoading(true);
         const res = await fetch(`/api/project/get-records?projectId=${projectId}`);
         console.log(`[GeneratedLinks] API response status: ${res.status}`);

         if (!res.ok) {
           const errorText = await res.text();
           throw new Error(`Failed fetching records. Status: ${res.status}. Body: ${errorText}`);
         }

         const data = await res.json();
         console.log("[GeneratedLinks] Data received:", data);

         setLinks(data || []);
         setError(null);
       } catch (err: any) {
         console.error("[GeneratedLinks] Fetch error:", err);
         setError(err.message || "Unknown error");
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       if (!projectId) {
         console.log("[GeneratedLinks] No projectId provided.");
         return;
       }
       console.log("[GeneratedLinks] Component mounted with projectId:", projectId);
       fetchLinks();
       const interval = setInterval(fetchLinks, 10000); // poll every 10s
       return () => clearInterval(interval);
     }, [projectId]);

     if (loading) {
        console.log("[GeneratedLinks] Render: Loading state");
        return <div>Loading audio links…</div>;
     }
     if (error) {
        console.error("[GeneratedLinks] Render: Error state", error);
        return <div className="text-red-500">Error: {error}</div>;
     }

     console.log(`[GeneratedLinks] Render: Success state with ${links.length} links.`);

     return (
       <div>
         <h3>Generated Audio ({links.length})</h3>
         {links.length === 0 ? <p>No audio yet.</p> : null}
         {links.map((l) => (
           <div key={l.id} className="p-2 border rounded mb-2">
             <p className="text-xs break-all">{l.project_link}</p>
             <audio controls src={l.project_link} className="w-full mt-2" />
           </div>
         ))}
       </div>
     );
   }