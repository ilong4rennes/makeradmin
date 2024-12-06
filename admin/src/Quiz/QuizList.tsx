import React, { Component } from "react";
import { Link } from "react-router-dom";
import CollectionTable from "../Components/CollectionTable";
import Collection from "../Models/Collection";
import Quiz from "../Models/Quiz";

interface QuizListState {
    search: string;
    page: number;
    collection: Collection;
}

class QuizList extends Component<{}, QuizListState> {
    constructor(props: {}) {
        super(props);

        // Initialize state
        this.state = {
            search: "",
            page: 1,
            collection: new Collection({ type: Quiz, search: "", page: 1 }),
        };

        this.onPageNav = this.onPageNav.bind(this);
        this.onSearch = this.onSearch.bind(this);
    }

    // Handle search updates
    onSearch(term: string) {
        const { collection } = this.state;
        this.setState({ search: term, page: 1 }, () => {
            collection.updateSearch(term);
        });
    }

    // Handle page navigation
    onPageNav(index: number) {
        const { collection } = this.state;
        this.setState({ page: index }, () => {
            collection.updatePage(index);
        });
    }

    render() {
        const { search, page, collection } = this.state;

        return (
            <div className="uk-margin-top">
                <h2>Quizzes</h2>
                <p className="uk-float-left">
                    På denna sida ser du en lista med samtliga quiz.
                </p>
                <Link
                    className="uk-button uk-button-primary uk-margin-bottom uk-float-right"
                    to="/quiz/add"
                >
                    <i className="uk-icon-plus-circle" /> Skapa nytt quiz
                </Link>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => this.onSearch(e.target.value)}
                    placeholder="Search..."
                />
                <CollectionTable
                    className="uk-margin-top"
                    collection={collection}
                    emptyMessage="Inga quiz"
                    columns={[{ title: "Namn" }, { title: "" }]}
                    onPageNav={this.onPageNav}
                    rowComponent={({
                        item,
                        deleteItem,
                    }: {
                        item: Quiz;
                        deleteItem: any;
                    }) => (
                        <tr>
                            <td>
                                <Link to={"/quiz/" + item.id}>{item.name}</Link>
                            </td>
                            <td>
                                <a
                                    onClick={() => deleteItem(item)}
                                    className="removebutton"
                                >
                                    <i className="uk-icon-trash" />
                                </a>
                            </td>
                        </tr>
                    )}
                />
                <div>
                    <button
                        onClick={() => this.onPageNav(page - 1)}
                        disabled={page <= 1}
                    >
                        Previous
                    </button>
                    <button onClick={() => this.onPageNav(page + 1)}>
                        Next
                    </button>
                </div>
            </div>
        );
    }
}

export default QuizList;
