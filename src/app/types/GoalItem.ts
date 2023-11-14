export interface GoalItem {
  step: string;
  prevGoal: number;
  goal: number;
  leftImage: string;
  rightImage: string;
  bgcolor: string;
  title: string;
  ticker: string;
  complete: boolean;
  current: boolean;
  percent?: number;
}
