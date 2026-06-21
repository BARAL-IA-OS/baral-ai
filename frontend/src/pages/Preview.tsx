import { useParams } from 'react-router-dom'
import { RecipePreview } from '../components/recipes/RecipePreview'
import { TaskDetail } from '../components/history/TaskDetail'

export function Preview() {
  const { taskId } = useParams()

  return (
    <section className="page stack">
      <div>
        <h1>Preview</h1>
        <p>Task: {taskId}</p>
      </div>
      <RecipePreview />
      <TaskDetail />
    </section>
  )
}
