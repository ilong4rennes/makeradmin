import React, { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";

export default function CollectionNavigation({ collection }) {
    const location = useLocation();
    const history = useHistory();
    const params = new URLSearchParams(location.search);

    const [search, setSearch] = useState(params.get("search") || "");
    const [page, setPage] = useState(Number(params.get("page")) || 1);

    // Helper function to update URL history
    const setHistory = () => {
        if (search === "") {
            params.delete("search");
        } else {
            params.set("search", search);
        }

        if (page === 1) {
            params.delete("page");
        } else {
            params.set("page", page);
        }

        history.replace(location.pathname + "?" + params.toString());
    };

    // Function to handle page navigation
    const onPageNav = (index) => {
        setPage(index);
        setHistory();
        collection.updatePage(index);
    };

    // Function to handle new data
    const gotNewData = (newPage) => {
        // If the returned result has fewer number of pages, keep the page within bounds
        if (newPage.last_page < page) {
            onPageNav(newPage.last_page);
        }
    };

    // Effect to subscribe to collection updates
    useEffect(() => {
        const unsubscribe = collection.subscribe(({ page: currentPage }) => {
            gotNewData(currentPage); // Use renamed parameter to avoid shadowing
        });

        return () => {
            unsubscribe();
        };
    }, [collection]);

    // Function to handle search term updates
    const onSearch = (term) => {
        setSearch(term);
        setHistory();
        collection.updateSearch(term);
    };

    return (
        <div>
            {/* Add your JSX UI for navigation */}
            <input
                type="text"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search..."
            />
            <button onClick={() => onPageNav(page - 1)} disabled={page <= 1}>
                Previous
            </button>
            <button onClick={() => onPageNav(page + 1)}>Next</button>
        </div>
    );
}