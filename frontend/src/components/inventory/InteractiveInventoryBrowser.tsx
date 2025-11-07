import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FoodItem, Category, PaginationInfo } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { CategoryFilter } from './index';
import InteractiveItemGrid from './InteractiveItemGrid';
import SearchAndFilter from './SearchAndFilter';
import { InteractiveBackground } from '../common/InteractiveBackground';
import { MouseReactiveElement } from '../common/MouseReactiveElement';
import { MouseFollowGlow } from '../common/MouseFollowGlow';
import { MouseTrackingTilt } from '../common/MouseTrackingTilt';

interface InteractiveInventoryBrowserProps {}

const InteractiveInventoryBrowser: React.FC<InteractiveInventoryBrowserProps> = () => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load items when category changes
  useEffect(() => {
    loadItems();
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time stock updates using polling
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    // Set up polling for stock updates every 30 seconds
    intervalRef.current = setInterval(() => {
      if (!isLoadingItems && items.length > 0) {
        loadItems(pagination?.currentPage || 1, true); // true indicates real-time update
      }
    }, 30000); // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTimeEnabled, isLoadingItems, items.length, pagination?.currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    try {
      setError(null);
      const categoriesData = await inventoryService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      console.error('Error loading categories:', err);
    }
  };

  const loadItems = useCallback(async (page: number = 1, isRealTimeUpdate: boolean = false) => {
    try {
      setError(null);
      if (!isRealTimeUpdate) {
        setIsLoadingItems(true);
      } else {
        setIsUpdatingStock(true);
      }
      
      const { items: itemsData, pagination: paginationData } = await inventoryService.getItems({
        category: selectedCategory,
        page,
        limit: 12,
        search: searchQuery || undefined,
        minPrice: priceRange.min > 0 ? priceRange.min : undefined,
        maxPrice: priceRange.max < 100 ? priceRange.max : undefined,
        sortBy,
        sortOrder
      });
      
      setItems(itemsData);
      setPagination(paginationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
      console.error('Error loading items:', err);
    } finally {
      if (!isRealTimeUpdate) {
        setIsLoadingItems(false);
        setIsLoading(false);
      } else {
        setIsUpdatingStock(false);
      }
    }
  }, [selectedCategory, searchQuery, priceRange.min, priceRange.max, sortBy, sortOrder]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setIsLoadingItems(true);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setIsLoadingItems(true);
  }, []);

  const handlePriceRangeChange = useCallback((min: number, max: number) => {
    setPriceRange({ min, max });
    setIsLoadingItems(true);
  }, []);

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setIsLoadingItems(true);
  }, []);

  const handlePageChange = (page: number) => {
    loadItems(page);
    // Scroll to top of the items grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <InteractiveBackground 
          particleCount={20}
          colors={['#ef4444', '#f97316', '#eab308']}
        />
        <div className="relative z-10 text-center py-12">
          <MouseReactiveElement
            intensity={1.2}
            magneticRadius={200}
            tiltStrength={10}
            glowIntensity={0.4}
            className="inline-block"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Inventory</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  loadCategories();
                  loadItems();
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          </MouseReactiveElement>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Interactive Background */}
      <InteractiveBackground 
        particleCount={25}
        mouseInfluence={60}
        colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981']}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <MouseTrackingTilt tiltStrength={6} trackingRadius={250} className="inline-block">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Browse Menu
                </h1>
                <p className="text-gray-600">Discover delicious food items and add them to your cart</p>
              </div>
            </MouseTrackingTilt>
            
            {/* Real-time updates toggle */}
            <MouseFollowGlow glowColor="rgba(59, 130, 246, 0.3)" glowSize={200}>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 font-medium">Real-time updates</span>
                <button
                  onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    isRealTimeEnabled ? 'bg-blue-600 shadow-lg' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                      isRealTimeEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                {isRealTimeEnabled && (
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    Live
                  </div>
                )}
                </div>
              </div>
            </MouseFollowGlow>
          </div>
        </div>

        {/* Category Filter */}
        <MouseReactiveElement
          intensity={0.8}
          magneticRadius={180}
          tiltStrength={6}
          glowIntensity={0.2}
          className="mb-6"
        >
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            isLoading={isLoading}
          />
        </MouseReactiveElement>

        {/* Search and Filter */}
        <MouseReactiveElement
          intensity={0.8}
          magneticRadius={180}
          tiltStrength={6}
          glowIntensity={0.2}
          className="mb-6"
        >
          <SearchAndFilter
            onSearchChange={handleSearchChange}
            onPriceRangeChange={handlePriceRangeChange}
            onSortChange={handleSortChange}
            isLoading={isLoadingItems}
            totalItems={pagination?.totalItems || 0}
          />
        </MouseReactiveElement>

        {/* Stock update indicator */}
        {isUpdatingStock && (
          <MouseReactiveElement
            intensity={1}
            magneticRadius={150}
            tiltStrength={8}
            glowIntensity={0.3}
            className="mb-4 flex items-center justify-center"
          >
            <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl px-6 py-3 flex items-center shadow-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700 text-sm font-medium">Updating stock information...</span>
            </div>
          </MouseReactiveElement>
        )}

        {/* Items Grid */}
        <InteractiveItemGrid
          items={items}
          isLoading={isLoadingItems}
          showStockAnimation={isUpdatingStock}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <MouseReactiveElement
            intensity={1}
            magneticRadius={200}
            tiltStrength={8}
            glowIntensity={0.3}
            className="mt-8 flex justify-center"
          >
            <nav className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  pagination.hasPrevPage
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Previous
              </button>

              {/* Page numbers */}
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                const isCurrentPage = page === pagination.currentPage;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isCurrentPage
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  pagination.hasNextPage
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </nav>
          </MouseReactiveElement>
        )}

        {/* Items count info */}
        {pagination && (
          <div className="mt-6 text-center">
            <MouseReactiveElement
              intensity={0.6}
              magneticRadius={120}
              tiltStrength={4}
              glowIntensity={0.2}
              className="inline-block"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm">
                Showing {items.length} of {pagination.totalItems} items
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              </div>
            </MouseReactiveElement>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveInventoryBrowser;