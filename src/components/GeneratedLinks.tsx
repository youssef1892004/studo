import React, { useEffect, useState } from "react";

// Updated type to include optional error field
type LinkItem = { 
  id: string; 
  projectid: string; 
  project_link: string | null; 
  error?: string; 
};

export default function GeneratedLinks({ projectId }: { projectId: string }) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      // No need to set loading to true on every poll
      if (loading) setLoading(true);
      const res = await fetch(`/api/project/get-records?projectId=${projectId}`);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed fetching records. Status: ${res.status}. Body: ${errorText}`);
      }

      const data = await res.json();
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
      return;
    }
    fetchLinks();
    const interval = setInterval(fetchLinks, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) {
    return <div>Loading audio links…</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Generated Audio</h3>
      {links.map((l) => (
        <div key={l.id} className="p-3 border rounded-lg mb-3 bg-gray-50">
          {l.error ? (
            <div>
              <p className="text-red-600 font-semibold">تعذر تحميل الصوت:</p>
              <p className="text-red-500 text-sm break-all">{l.error}</p>
            </div>
          ) : l.project_link ? (
            <audio controls src={l.project_link} className="w-full" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
