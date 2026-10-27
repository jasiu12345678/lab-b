const todo = {
    tasks: JSON.parse(localStorage.getItem("todo.tasks")) || [
        { text: "do this", date: "" },
        { text: "MUST DO THIS", date: "" },
        { text: "thing", date: "" },
    ],
    term: "",
    editing: null,

    validate(text, date, oldDate = "") {
        const len = text.trim().length;
        if (len < 3 || len > 255) return "Task must have 3-255 characters.";
        if (date && date !== oldDate && new Date(date) <= new Date()) return "Date must be empty or in the future.";
        return "";
    },

    add(text, date = "") {
        const error = this.validate(text, date);
        if (!error) {
            this.tasks.push({ text: text.trim(), date });
            this.update();
        }
        return error;
    },

    remove(index) {
        this.tasks.splice(index, 1);
        this.editing = null;
        this.update();
    },

    edit(index, text, date = "") {
        const error = this.validate(text, date, this.tasks[index].date);
        if (!error) {
            this.tasks[index] = { text: text.trim(), date };
            this.editing = null;
            this.update();
        }
        return error;
    },

    get filteredTasks() {
        const term = this.term.toLowerCase();
        return this.tasks
            .map((task, index) => ({ ...task, index }))
            .filter((task) => term.length < 2 || task.text.toLowerCase().includes(term));
    },

    update() {
        localStorage.setItem("todo.tasks", JSON.stringify(this.tasks));
        this.draw();
    },

    draw() {
        const list = document.querySelector(".list");
        list.replaceChildren();
        const term = this.term.toLowerCase();

        for (const task of this.filteredTasks) {
            const li = document.createElement("li");
            li.dataset.index = task.index;

            if (task.index === this.editing) {
                const text = Object.assign(document.createElement("input"), { value: task.text, className: "edit-text" });
                const date = Object.assign(document.createElement("input"), { type: "datetime-local", value: task.date, className: "edit-date" });
                const error = Object.assign(document.createElement("span"), { className: "error" });
                li.append(text, date, error);
                li.save = () => (error.textContent = this.edit(task.index, text.value, date.value));
            } else {
                const span = document.createElement("span");
                span.className = "task-text";
                const parts = term.length < 2 ? [task.text] : task.text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i"));
                parts.forEach((part, i) => {
                    const node = i % 2 ? document.createElement("mark") : document.createElement("span");
                    node.textContent = part;
                    span.append(node);
                });
                li.append(span);
                if (task.date) li.append(Object.assign(document.createElement("time"), { textContent: new Date(task.date).toLocaleString() }));
                li.append(Object.assign(document.createElement("button"), { textContent: "🗑", title: "Remove" }));
            }
            list.append(li);
        }
    },
};

todo.draw();
document.todo = todo;

document.querySelector("#fsearch").addEventListener("input", (event) => {
    todo.term = event.target.value.trim();
    todo.draw();
});

document.addEventListener("click", (event) => {
    const li = event.target.closest(".list li");
    const index = li && Number(li.dataset.index);
    const editedLi = document.querySelector(".list li:has(.edit-text)");

    if (editedLi && li !== editedLi && editedLi.save()) return;
    if (!li || li === editedLi) return;
    if (event.target.closest("button")) return todo.remove(index);
    todo.editing = index;
    todo.draw();
    document.querySelector(".edit-text").focus();
});

document.querySelector(".list").addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.target.closest("li").save?.();
    if (event.key === "Escape") {
        todo.editing = null;
        todo.draw();
    }
});

document.querySelector("#add-task-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const text = document.querySelector("#ftask");
    const date = document.querySelector("#fdate");
    const error = todo.add(text.value, date.value);
    document.querySelector("#add-error").textContent = error;
    if (!error) event.target.reset();
});