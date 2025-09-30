// src/app/projects/page.tsx
'use client';

import { AuthContext } from "@/contexts/AuthContext";
import { getProjectsByUserId, insertProject, deleteProject } from "@/lib/graphql";
import { FilePlus, LoaderCircle, Orbit, Trash2 } from "lucide-react"; 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState, MouseEvent } from "react";

interface Project {
    id: string;
    comments: string; 
    last_updated: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // --- (جديد) حالات لإدارة نافذة تأكيد الحذف ---
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
            setNewProjectName("");
        }
    };

    // --- (جديد) دالة لفتح نافذة التأكيد ---
    const handleDeleteClick = (project: Project, e: MouseEvent) => {
        e.preventDefault(); // منع الانتقال إلى صفحة المشروع
        e.stopPropagation();
        setProjectToDelete(project);
    };

    // --- (جديد) دالة لتأكيد وتنفيذ الحذف ---
    const confirmDelete = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            await deleteProject(projectToDelete.id);
            // تحديث قائمة المشاريع في الواجهة فورًا
            setProjects(currentProjects => currentProjects.filter(p => p.id !== projectToDelete.id));
        } catch (error) {
            console.error("Failed to delete project", error);
            // يمكنك إضافة رسالة خطأ للمستخدم هنا
        } finally {
            setIsDeleting(false);
            setProjectToDelete(null);
        }
    };


    if (isLoading) {
        // تنسيقات التحميل
        return <div className="flex items-center justify-center h-screen text-gray-800 dark:text-white"><Orbit className="animate-spin" size={48} /></div>;
    }

    return (
        <>
            <main className="container mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    {/* العنوان الرئيسي */}
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Projects</h1>
                    {/* زر إنشاء مشروع جديد */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-blue-600 text-white font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors"
                    >
                        <FilePlus size={18} />
                        New Project
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {projects.map(project => (
                        <Link 
                            href={`/studio/${project.id}`} 
                            key={project.id} 
                            // تنسيقات البطاقة
                            className="group relative block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
                        >
                            {/* عنوان المشروع */}
                            <h2 className="text-xl font-bold truncate mb-2 text-gray-900 dark:text-white">{project.comments || "Untitled Project"}</h2>
                            {/* تاريخ آخر تحديث */}
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Last updated: {new Date(project.last_updated).toLocaleDateString()}
                            </p>
                            {/* زر الحذف */}
                            <button 
                                onClick={(e) => handleDeleteClick(project, e)}
                                // تم تغيير top-3 إلى bottom-3
                                className="absolute bottom-3 right-3 p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete project"
                            >
                                <Trash2 size={18} />
                            </button>
                        </Link>
                    ))}
                </div>

                 {projects.length === 0 && !isLoading && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 dark:text-gray-400">You don&apos;t have any projects yet.</p>
                    </div>
                )}
            </main>

            {/* --- نافذة إنشاء مشروع (Modal) --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Create New Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Enter project name..."
                                // تنسيقات الإدخال
                                className="w-full p-3 border rounded-md mb-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                autoFocus
                            />
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={isCreating || !newProjectName} 
                                    className="px-4 py-2 bg-black dark:bg-blue-600 text-white rounded-md disabled:bg-gray-400 dark:disabled:bg-gray-600"
                                >
                                    {isCreating ? <LoaderCircle className="animate-spin" /> : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- نافذة تأكيد الحذف (Modal) --- */}
            {projectToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setProjectToDelete(null)}>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Confirm Deletion</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete the project &quot;<span className="font-semibold">{projectToDelete.comments}</span>&quot;? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => setProjectToDelete(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                            <button 
                                onClick={confirmDelete} 
                                disabled={isDeleting} 
                                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-400 dark:disabled:bg-red-800/50 flex items-center"
                            >
                                {isDeleting ? <LoaderCircle className="animate-spin mr-2" size={18} /> : null}
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}