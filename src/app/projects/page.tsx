'use client';

import { AuthContext } from "@/contexts/AuthContext";
import { getProjectsByUserId, insertProject } from "@/lib/graphql";
import { FilePlus, LoaderCircle, Orbit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

// Define the Project type locally for this component
interface Project {
    id: string;
    comments: string; // title
    last_updated: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const authContext = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (authContext?.user?.id) {
            getProjectsByUserId(authContext.user.id)
                .then(setProjects)
                .catch(err => console.error("Failed to fetch projects", err))
                .finally(() => setIsLoading(false));
        }
    }, [authContext?.user?.id]);
    
    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim() || !authContext?.user?.id) return;
        setIsCreating(true);
        try {
            const newProject = await insertProject(authContext.user.id, newProjectName);
            router.push(`/studio/${newProject.id}`);
        } catch (error) {
            console.error("Failed to create project", error);
        } finally {
            setIsCreating(false);
            setShowCreateModal(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Orbit className="animate-spin" size={48} /></div>;
    }

    return (
        <>
            <main className="container mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800"
                    >
                        <FilePlus size={18} />
                        New Project
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {projects.map(project => (
                        <Link href={`/studio/${project.id}`} key={project.id} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow">
                            <h2 className="text-xl font-bold truncate mb-2">{project.comments || "Untitled Project"}</h2>
                            <p className="text-sm text-gray-500">
                                Last updated: {new Date(project.last_updated).toLocaleDateString()}
                            </p>
                        </Link>
                    ))}
                </div>

                 {projects.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500">You don't have any projects yet.</p>
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Enter project name..."
                                className="w-full p-3 border rounded-md mb-4"
                                autoFocus
                            />
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-black text-white rounded-md disabled:bg-gray-400">
                                    {isCreating ? <LoaderCircle className="animate-spin" /> : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}