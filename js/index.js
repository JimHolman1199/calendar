
(function () {
  window.addEventListener('load', documentReady, false);

  function documentReady(event) {
    window.removeEventListener('load', documentReady, false);
    main();
  }

  function setHeader(date) {
    let header = document.getElementById('header');
    let now = moment(date);
    let left = header.querySelector('.arrow--left');
    let right = header.querySelector('.arrow--right');

    left.dataset.next = now.subtract(1, 'month').format('YYYY-MM-DD');
    now.add(1, 'month');
    right.dataset.next = now.add(1, 'month').format('YYYY-MM-DD');
    now.subtract(1, 'month');

    header.querySelector('.main-date__container__day').textContent = now.date();
    header.querySelector('.main-date__container__month').textContent = now.format('MMMM');
    header.querySelector('.main-date__container__year').textContent = now.year();
  }

  function getTasks(date) {
    let all = JSON.parse(localStorage.getItem('tasks'));
    if (all) {
      return all[date];
    }
  }

  function createCalendar(date, container) {
    var date = moment(date);
    let now_date = moment();

    let days = date.daysInMonth();
    let firstDay = date.set('date', 1).isoWeekday();
    let skipDays = firstDay - 1;
    let calTemplate = Handlebars.compile(document.getElementById('cal').innerHTML);
    let data = { days: [] }

    for (i = 1; i <= days + skipDays; i++) {
      let day = {};
      if (i === 1) day.first = true;
      if (i === days) day.last = true;
      if (((i - 1) % 7) === 0) {
        day.newWeek = true;
      }
      if (i - skipDays > 0) {
        day.number = i - skipDays;
        let date_string = date.format('YYYY-MM-DD');
        day.date = date_string;
        if (now_date.isSame(date, 'day')) {
          day.today = true;
        }
        let tasks = getTasks(date.format('YYYY-MM-DD'));
        if (tasks) {
          let undone = tasks.filter(function (t) { return t.done === false; });
          if (undone.length > 0) {
            day.has_tasks = true;
            day.done = false;
          } else {
            day.has_tasks = false;
            day.done = true;
          }
        } else {
          day.has_tasks = false;
          day.done = false;
        }
        date.add(1, 'day');
      }
      data.days.push(day);
    }
    container.innerHTML = calTemplate(data);
  }

  function createTaskContainer(date) {
    let container = document.createElement('div');
    let tasksTemplate = Handlebars.compile(document.getElementById('tasks').innerHTML);

    let data = { tasks: getTasks(date), date: date };
    container.innerHTML = tasksTemplate(data);

    return container.firstElementChild;
  }

  function daysGridClick(event) {
    let day = parseInt(event.target.textContent);
    let inputEventBind;

    if (day) {
      let date = event.target.offsetParent.dataset.date;
      let container = createTaskContainer(date);

      if (!event.target.classList.contains('day__status--taskopen')) {
        [].slice.call(document.querySelectorAll('.day__status--taskopen')).forEach(function (el) {
          el.classList.remove('day__status--taskopen');
        });
        [].slice.call(document.querySelectorAll('.daysgrid__tasks')).forEach(function (el) {
          el.parentNode.removeChild(el);
        });
        inputEventBind = bindInput(container);
        event.target.classList.add('day__status--taskopen');
        event.target.parentNode.parentNode.parentNode.insertBefore(container, event.target.parentNode.parentNode.nextSibling);
      } else {
        if (inputEventBind) inputEventBind.removeEventListener('keyup', inputKeyUp, false);
        event.target.classList.remove('day__status--taskopen')
        event.target.parentNode.parentNode.parentNode.removeChild(event.target.parentNode.parentNode.nextSibling);
      }
    } else if (event.target.classList.contains('btn')) {
      let date = event.target.parentNode.parentNode.parentNode.dataset.tasksfor;
      let id = event.target.parentNode.dataset.taskid;
      let ul = event.target.parentNode.parentNode;

      ul.removeChild(event.target.parentNode);

      let lis = getLiData(ul);
      updateStorage(date, lis);
      updateDay(date, lis);

    } else if (event.target.type === "checkbox") {
      let date = event.target.parentNode.parentNode.parentNode.dataset.tasksfor;
      let id = event.target.parentNode.dataset.taskid;
      let ul = event.target.parentNode.parentNode;

      let lis = getLiData(ul);
      updateStorage(date, lis);
      updateDay(date, lis);
    }
  }

  function getLiData(ul) {
    let data = [];
    let lis = [].slice.call(ul.querySelectorAll('li'));

    lis.forEach(function (li) {
      let temp = {};
      if (!!li.querySelector('input').checked === true) temp.done = true;
      else temp.done = false;
      temp.id = li.querySelector('input').id;
      temp.title = li.querySelector('label').textContent;
      data.push(temp);
    });

    return data;
  }

  function updateStorage(date, lis) {
    let data = (JSON.parse(localStorage.getItem('tasks')) || {});
    if (lis.length === 0) delete data[date];
    else data[date] = lis;
    localStorage.setItem('tasks', JSON.stringify(data));
  }

  function updateDay(date, lis) {
    let day = document.querySelector('div[data-date="' + date + '"]');
    let status = day.querySelector('.day__status');
    let undone = lis.filter(function (li) { return li.done === false; });

    status.classList.remove('day__status--done');
    status.classList.remove('day__status--undone');

    if (lis.length > 0) {
      if (undone.length > 0) {
        status.classList.remove('day__status--done');
        status.classList.add('day__status--undone');
      } else {
        status.classList.remove('day__status--undone');
        status.classList.add('day__status--done');
      }
    }
  }

  function loadMonth(event) {
    let newDate = this.dataset.next;
    let daysGrid = document.getElementById('daysgrid');
    setHeader(newDate);
    createCalendar(newDate, daysGrid);
  }

  function bindInput(taskList) {
    let input = taskList.querySelector('#task_input');
    input.addEventListener('keyup', inputKeyUp, false);
    return input;
  }

  function createId() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
  }

  function addTask(container, title) {
    let cont = document.createElement('ul');
    let date = container.parentNode.dataset.tasksfor;
    let taskTemplate = Handlebars.compile(document.getElementById('task').innerHTML);
    let id = createId();

    cont.innerHTML = taskTemplate({ id: id, title: title, done: false });
    container.appendChild(cont.firstElementChild);

    let lis = getLiData(container);
    updateStorage(date, lis)
    updateDay(date, lis);
  }

  function inputKeyUp(event) {
    let taskList = event.target.parentNode.querySelector('ul');
    let text;

    if (event.keyCode === 0x0D) {
      event.preventDefault();
      text = event.target.value;
      event.target.value = '';
      if (!!text) addTask(taskList, text);
    }
  }

  function createDays(container, days) {
    let daysTemplate = Handlebars.compile(document.getElementById('days_template').innerHTML);
    container.innerHTML = daysTemplate({ days: days });
  }

  function main() {
    let data = new Date();
    let daysGrid = document.getElementById('daysgrid');
    let prev = document.querySelector('.arrow--left');
    let next = document.querySelector('.arrow--right');

    moment.locale(window.navigator.language || 'en');
    let days = moment.weekdaysShort();
    let first_day = days[0];
    days = days.slice(1).concat(first_day);

    daysGrid.addEventListener('click', daysGridClick, false);
    prev.addEventListener('click', loadMonth, false);
    next.addEventListener('click', loadMonth, false);

    setHeader(data);
    createDays(document.getElementById('days'), days);
    createCalendar(data, daysGrid);
  };
}());
