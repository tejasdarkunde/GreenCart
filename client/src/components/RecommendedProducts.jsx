import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from './ProductCard';

const RecommendedProducts = () => {
    const { user, axios } = useAppContext();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRecommendations();
        }
    }, [user]);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/ai/recommendations');
            if (data.success && data.products.length > 0) {
                setRecommendations(data.products);
            }
        } catch (e) {
            // Silently fail — recommendations are non-critical
        } finally {
            setLoading(false);
        }
    };

    if (!user || (recommendations.length === 0 && !loading)) return null;

    return (
        <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex flex-col items-start w-max">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🎯</span>
                        <p className="text-2xl font-medium">Recommended for You</p>
                    </div>
                    <div className="w-24 h-0.5 bg-green-400 rounded-full mt-1 ml-8"></div>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">AI Powered</span>
            </div>

            {loading ? (
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="min-w-56 h-72 bg-gray-100 rounded-md animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
                    {recommendations.slice(0, 10).filter(p => p.inStock).map((product, index) => (
                        <ProductCard key={index} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecommendedProducts;
