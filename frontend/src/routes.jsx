import { createBrowserRouter } from "react-router";
import Auth from "./pages/Auth";
import OnboardingSubjects from "./pages/OnboardingSubjects";
import OnboardingGoal from "./pages/OnboardingGoal";
import Dashboard from "./pages/Dashboard";
import GalaxyMap from "./pages/GalaxyMap";
import SubjectPage from "./pages/SubjectPage";
import NewChapterDetail from "./pages/NewChapterDetail";
import NewLearnMode from "./pages/NewLearnMode";
import NewAdaptiveQuiz from "./pages/NewAdaptiveQuiz";
import NewOperationVectorfall from "./pages/NewOperationVectorfall";
import Planet from "./pages/Planet";
import Chapter from "./pages/Chapter";
import Learn from "./pages/Learn";
import CaseArchive from "./pages/CaseArchive";
import CaseDetail from "./pages/CaseDetail";
import PersonalisedQuiz from "./pages/PersonalisedQuiz";
import MockTest from "./pages/MockTest";
import Practice from "./pages/Practice";
import Duels from "./pages/Duels";
import DuelMatch from "./pages/DuelMatch";
import DuelResult from "./pages/DuelResult";
import StudyPlanner from "./pages/StudyPlanner";
import ProtectedRoute from "./components/ProtectedRoute";

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Auth,
  },
  {
    path: "/onboarding/subjects",
    Component: OnboardingSubjects,
  },
  {
    path: "/onboarding/goal",
    Component: OnboardingGoal,
  },
  {
    path: "/dashboard",
    element: <Protected><Dashboard /></Protected>,
  },
  {
    path: "/galaxy",
    element: <Protected><GalaxyMap /></Protected>,
  },
  {
    path: "/subject/:subjectId",
    element: <Protected><SubjectPage /></Protected>,
  },
  {
    path: "/subject/:subjectId/chapter/:chapterId",
    element: <Protected><NewChapterDetail /></Protected>,
  },
  {
    path: "/subject/:subjectId/chapter/:chapterId/learn",
    element: <Protected><NewLearnMode /></Protected>,
  },
  {
    path: "/subject/:subjectId/chapter/:chapterId/quiz",
    element: <Protected><NewAdaptiveQuiz /></Protected>,
  },
  {
    path: "/subject/:subjectId/chapter/:chapterId/vectorfall",
    element: <Protected><NewOperationVectorfall /></Protected>,
  },
  {
    path: "/planet/:subjectId",
    element: <Protected><Planet /></Protected>,
  },
  {
    path: "/planet/:subjectId/chapter/:chapterId",
    element: <Protected><Chapter /></Protected>,
  },
  {
    path: "/planet/:subjectId/chapter/:chapterId/learn",
    element: <Protected><Learn /></Protected>,
  },
  {
    path: "/planet/:subjectId/chapter/:chapterId/practice",
    element: <Protected><CaseArchive /></Protected>,
  },
  {
    path: "/planet/:subjectId/chapter/:chapterId/practice/case/:caseId",
    element: <Protected><CaseDetail /></Protected>,
  },
  {
    path: "/planet/:subjectId/chapter/:chapterId/quiz",
    element: <Protected><PersonalisedQuiz /></Protected>,
  },
  {
    path: "/planet/:subjectId/chapter/:chapterId/mock-test",
    element: <Protected><MockTest /></Protected>,
  },
  {
    path: "/planet/:subjectId/chapter/:chapterId/old-practice",
    element: <Protected><Practice /></Protected>,
  },
  {
    path: "/duels",
    element: <Protected><Duels /></Protected>,
  },
  {
    path: "/duels/match",
    element: <Protected><DuelMatch /></Protected>,
  },
  {
    path: "/duels/result",
    element: <Protected><DuelResult /></Protected>,
  },
  {
    path: "/planner",
    element: <Protected><StudyPlanner /></Protected>,
  },
]);