import { format, formatDistanceToNowStrict, parseJSON, addDays, isBefore, isAfter } from "date-fns";
import { AppearanceConfig } from "../types/Config";
import { TaskData, Task } from "../types/Display";

const performCustomSort = (originalTasks: Task[]): Task[] => {
  // const temp: Task[] = [];
  // originalTasks
  //   .filter((task) => task.parent === undefined) // Filter tasks to only parent tasks
  //   .sort((a, b) => (a.position > b.position ? 1 : -1)) // Sort parent tasks by position
  //   .forEach((task) => {
  //     // Map over parents to create reordered list of tasks
  //     temp.push(task);

  //     // Loop through all tasks to find and sort subtasks for each parent
  //     const subList: Task[] = [];
  //     originalTasks.forEach((subtask) => {
  //       if (subtask.parent === task.id) {
  //         subList.push(subtask);
  //       }
  //     });
  //     subList.sort((a, b) => (a.position > b.position ? 1 : -1));
  //     temp.push(...subList);
  //   });

  let grouped: any = originalTasks.filter(task => task.parent);
  grouped = Object.groupBy(grouped, (item: any) => item.parent);

  const temp2: Task[] = originalTasks
    .filter((task) => task.parent === undefined);

  for (const [key, value] of Object.entries(grouped)) {
    const tasks = value as Task[];
    tasks.sort((a, b) => (a.position > b.position ? 1 : -1));
    const index = temp2.findIndex(item => item.id == key);
      if(index > -1){
        temp2[index].subTasks = tasks;
      }
  }

  temp2.sort((a, b) => (a.position > b.position ? 1 : -1));

  return temp2;
};

const getOrderedTasks = (originalTasks: Task[], config: AppearanceConfig): Task[] => {
  // Sort attributes like they are shown in the Tasks app
  switch (config.ordering) {
    case "myorder":
      return performCustomSort(originalTasks);

    case "due":
    case "title":
    case "updated":
      return originalTasks.sort((a, b) => {
        const aValue = a[config.ordering as keyof Task] ?? "";
        const bValue = b[config.ordering as keyof Task] ?? "";

        return aValue > bValue ? 1 : -1;
      });
  }
  return originalTasks;
};

const getDateSpan = (item: Task, config: AppearanceConfig): HTMLElement | undefined => {
  if (!item.due) {
    return undefined;
  }

  const dateWrapper = document.createElement("span");
  const classNames = ["date", "light"];
  const dueDate = addDays(parseJSON(item.due), 1);
  const now = new Date();
  const next24 = addDays(now, 1);

  // overdue
  if (isBefore(dueDate, now)) {
    classNames.push("overdue");
  }

  // due in the next day
  if (isBefore(dueDate, next24) && isAfter(dueDate, now)) {
    classNames.push("soon");
  }

  if (isAfter(dueDate, next24)) {
    classNames.push("upcoming");
  }

  if (config.useRelativeDate) {
    dateWrapper.innerHTML = formatDistanceToNowStrict(dueDate, { addSuffix: true });
  } else {
    dateWrapper.innerHTML = format(dueDate, config.dateFormat);
  }

  dateWrapper.className = classNames.join(" ");
  return dateWrapper;
};

const getItemView = (item: Task, config: AppearanceConfig): HTMLElement => {
  const itemWrapper = document.createElement("li");
  itemWrapper.className = "item";

  // Title
  const titleWrapper = document.createElement("span");

  titleWrapper.innerText = item.title;
  titleWrapper.className = "title";
  titleWrapper.innerText = item.title;

  itemWrapper.appendChild(titleWrapper);

  // DATE
  const dateWrapper = getDateSpan(item, config);

  if (dateWrapper) {
    itemWrapper.appendChild(dateWrapper);
  }

  // Notes
  if(item.notes){
    const descWrapper = document.createElement("p");
    descWrapper.innerText = item.notes;
    descWrapper.className = "notes";
    
    itemWrapper.appendChild(descWrapper);
  }

  return itemWrapper;
};

export const getTaskView = (taskData: TaskData, config: AppearanceConfig): HTMLElement => {
  const wrapper = document.createElement("ul");
  wrapper.style.maxWidth = config.maxWidth ?? "auto";

  const tasks: Task[] = getOrderedTasks(taskData.tasks, config);

  tasks.forEach((item) => {
    const itemWrapper = getItemView(item, config);
    wrapper.appendChild(itemWrapper);

    if(item.subTasks){
      const innerWrapper = document.createElement("ul");
      innerWrapper.style.maxWidth = config.maxWidth ?? "auto";
      
      item.subTasks.forEach(subTask => {
        const innerItemWrapper = getItemView(subTask, config);
        innerWrapper.appendChild(innerItemWrapper);
      })


      itemWrapper.appendChild(innerWrapper);
      
    }
  });

  return wrapper;
};

export const getLoadingView = (config: AppearanceConfig): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.className = "wrapper";
  wrapper.style.maxWidth = config.maxWidth ?? "auto";

  wrapper.innerHTML = "Loading Google Tasks";
  wrapper.classList.add("bright", "light", "small");
  return wrapper;
};
