import React from "react";
import Quiz from "../Models/Quiz";
import { browserHistory } from "../browser_history";
import { confirmModal } from "../message";
import QuestionListRouter from "./QuestionList";
import QuizEditForm from "./QuizEditForm";

interface State {
    quiz: Quiz;
    loaded: boolean;
}

interface Props {
    match: { params: { id: string } };
}

class QuizShow extends React.Component<Props, State> {
    unsubscribe: () => void;

    constructor(props: Props) {
        super(props);
        const { id } = this.props.match.params;
        const quiz = Quiz.get(id) as Quiz;
        this.state = { quiz, loaded: false };
        this.unsubscribe = () => {}; // Initialize to avoid undefined
    }

    componentDidMount() {
        this.unsubscribe = this.state.quiz.subscribe(() =>
            this.setState({ loaded: true }),
        );
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    save() {
        this.state.quiz.save();
    }

    async delete() {
        try {
            await confirmModal(this.state.quiz.deleteConfirmMessage());
            await this.state.quiz.del();
            browserHistory.push("/quiz/");
        } catch {
            // Handle any errors gracefully
        }
    }

    async restore() {
        this.state.quiz.deleted_at = null;
        await this.state.quiz.save();
        await this.state.quiz.refresh();
    }

    render() {
        const { quiz } = this.state;

        if (quiz.deleted_at !== null) {
            return (
                <>
                    <h1>{quiz.name}</h1>
                    <p>Det här quizzet har blivit raderat :(</p>
                </>
            );
        }

        return (
            <>
                <QuizEditForm
                    quiz={quiz}
                    onSave={() => this.save()}
                    onDelete={() => this.delete()}
                />
                {/* Ensure quiz_id is declared in QuestionListRouter props */}
                <QuestionListRouter quiz_id={quiz.id} />
            </>
        );
    }
}

export default QuizShow;
