import { createBrowserRouter } from "react-router";
import Auth from "./pages/Auth";
import OnboardingSubjects from "./pages/OnboardingSubjects";
import OnboardingGoal from "./pages/OnboardingGoal";
import Dashboard from "./pages/Dashboard";
import GalaxyMap from "./pages/GalaxyMap";
import SubjectPage from "./pages/SubjectPage";
import NewChapterDetail from "./pages/NewChapterDetail";
import NewLearnMode from "./pages/NewLearnMode";
import LimitsLab from "./pages/limits-lab";
import NewAdaptiveQuiz from "./pages/NewAdaptiveQuiz";
import NewOperationVectorfall from "./pages/NewOperationVectorfall";
import Planet from "./pages/Planet";
import Chapter from "./pages/Chapter";
import Learn from "./pages/Learn";
import CaseArchive from "./pages/CaseArchive";
import CaseDetail from "./pages/CaseDetail";
import PersonalisedQuiz from "./pages/PersonalisedQuiz";
import MockTest from "./pages/MockTest";
import MockTests from "./pages/MockTests";
import MockTest2 from "./pages/MockTest2";
import MockTestResults from "./pages/MockTestResults";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Practice from "./pages/Practice";
import Duels from "./pages/Duels";
import DuelMatch from "./pages/DuelMatch";
import DuelResult from "./pages/DuelResult";
import StudyPlanner from "./pages/StudyPlanner";
import ChemBonding from "./pages/chemBonding";
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
    path: "/subject/chemistry/chapter/bonding/learn",
    element: <Protected><ChemBonding /></Protected>,
  },
  {
    path: "/subject/maths/chapter/limits/learn",
    element: <Protected><LimitsLab /></Protected>,
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
    path: "/planet/chemistry/chapter/chemical-bonding",
    element: <Protected><ChemBonding /></Protected>,
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
  {
    path: "/tests",
    element: <Protected><MockTests /></Protected>,
  },
  {
    path: "/tests/interface",
    element: <Protected><MockTest2 /></Protected>,
  },
  {
    path: "/tests/results",
    element: <Protected><MockTestResults /></Protected>,
  },
  {
    path: "/analytics",
    element: <Protected><Analytics /></Protected>,
  },
  {
    path: "/settings",
    element: <Protected><Settings /></Protected>,
  },
]);