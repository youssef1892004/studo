'use client';

import { AuthContext } from "@/contexts/AuthContext";
import { getProjectsByUserId, insertProject, deleteProject } from "@/lib/graphql";
import { FilePlus, LoaderCircle, Trash2, Zap, Users, Image, Video, Mic } from "lucide-react"; 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState, MouseEvent } from "react";
import toast from "react-hot-toast";
import { Project } from "@/lib/types"; // Import Project type

const upcomingFeatures = [
    {
        title: "المؤثرات الصوتية", 
        description: "إضافة تأثيرات (صدى، فلترة، تردد) على المقاطع الصوتية.", 
        icon: Zap 
    },
    {
        title: "أصوات جديدة وموسعة", 
        description: "إطلاق مجموعة ضخمة من الأصوات الاحترافية واللهجات الإقليمية.", 
        icon: Users 
    },
    {
        title: "توليد الصور بالذكاء الاصطناعي", 
        description: "تحويل النص إلى صورة (Text-to-Image) لإنشاء خلفيات بصرية.", 
        icon: Image 
    },
    {
        title: "توليد الفيديوهات القصيرة", 
        description: "دمج الصوت مع الصور الثابتة أو مقاطع الفيديو البسيطة.", 
        icon: Video 
    },
    {
        title: "التسجيل وتحويل الصوت (AI)", 
        description: "سجل صوتك وحوّله إلى أي صوت آخر مدعوم بتقنيات الاستنساخ الآمن.", 
        icon: Mic 
    },
];

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectDescription, setNewProjectDescription] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const authContext = useContext(AuthContext);
    const router = useRouter();

    // Handle case where user is not logged in to avoid infinite loading
    useEffect(() => {
        if (!authContext?.isLoading && !authContext?.user) {
            setIsLoading(false);
            router.replace('/login');
        }
    }, [authContext?.isLoading, authContext?.user, router]);

    useEffect(() => {
        if (authContext?.user?.id) {
            getProjectsByUserId(authContext.user.id)
                .then(setProjects)
                .catch(err => {
                    console.error("Failed to fetch projects", err);
                    toast.error("فشل تحميل المشاريع. حاول إعادة تحميل الصفحة.");
                })
                .finally(() => setIsLoading(false));
        }
    }, [authContext?.user?.id]);
    
    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim() || !authContext?.user?.id) return;
        setIsCreating(true);
        try {
            const newProject = await insertProject(authContext.user.id, newProjectName, newProjectDescription);
            toast.success(`تم إنشاء مشروع "${newProjectName}" بنجاح!`);
            router.push(`/studio/${newProject.id}`);
        } catch (error) {
            console.error("Failed to create project", error);
            toast.error("فشل إنشاء المشروع.");
        } finally {
            setIsCreating(false);
            setShowCreateModal(false);
            setNewProjectName("");
            setNewProjectDescription("");
        }
    };

    const handleDeleteClick = (project: Project, e: MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        setProjectToDelete(project);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        const projectName = projectToDelete.name;
        try {
            await deleteProject(projectToDelete.id);
            setProjects(currentProjects => currentProjects.filter(p => p.id !== projectToDelete.id));
            toast.success(`تم حذف المشروع "${projectName}" بنجاح.`);
        } catch (error) {
            console.error("Failed to delete project", error);
            toast.error("فشل حذف المشروع.");
        } finally {
            setIsDeleting(false);
            setProjectToDelete(null);
        }
    };


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
                <LoaderCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                <p className="text-lg font-medium">جاري تحميل مشاريعك...</p>
            </div>
        );
    }

    return (
        <>
            <main className="container mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Projects</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-blue-600 text-white font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors"
                    >
                        <FilePlus size={18} />
                        New Project
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {projects.map(project => (
                        <Link 
                            href={`/studio/${project.id}`}
                            key={project.id} 
                            className="group relative block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
                        >
                            <h2 className="text-xl font-bold truncate mb-2 text-gray-900 dark:text-white">{project.name || "Untitled Project"}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.description || "No description"}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Created: {new Date(project.created_at).toLocaleDateString()}
                            </p>
                            <button 
                                onClick={(e) => handleDeleteClick(project, e)}
                                className="absolute bottom-3 right-3 p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete project"
                            >
                                <Trash2 size={18} />
                            </button>
                        </Link>
                    ))}
                </div>

                {projects.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500 dark:text-gray-400">ابدأ بإنشاء مشروعك الأول!</p>
                    </div>
                )}
                
                <div className="mt-12 border-t pt-8 border-gray-200 dark:border-gray-700">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">قريباً: المزيد من القوة الإبداعية</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingFeatures.map((feature, index) => (
                            <div 
                                key={index} 
                                className="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-dashed border-blue-300 dark:border-blue-600/50 opacity-70 hover:opacity-100 transition-opacity"
                            >
                                <span className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                                    قريباً
                                </span>
                                <div className="flex items-start gap-4">
                                    <feature.icon className="w-10 h-10 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

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
                                className="w-full p-3 border rounded-md mb-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                autoFocus
                            />
                            <textarea
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                                placeholder="Enter project description (optional)..."
                                className="w-full p-3 border rounded-md mb-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={3}
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
                            Are you sure you want to delete the project &quot;<span className="font-semibold">{projectToDelete.name}</span>&quot;? This action cannot be undone.
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
