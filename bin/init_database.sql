CREATE DATABASE TLP;
USE TLP;

CREATE TABLE studentinfo (
    rollno VARCHAR(15) NOT NULL PRIMARY KEY,
    Name VARCHAR(255) DEFAULT NULL,
    sec VARCHAR(2) DEFAULT NULL,
    sem INT DEFAULT NULL,
    branch VARCHAR(10) DEFAULT NULL,
    batch INT DEFAULT NULL,
    token1 ENUM('facdone', 'undone', 'done') DEFAULT NULL,
    token2 ENUM('facdone', 'undone', 'done') DEFAULT NULL,
    password VARCHAR(255) DEFAULT NULL
    );

CREATE TABLE subjects (
    subCode VARCHAR(25) NOT NULL,
    subName VARCHAR(255) DEFAULT NULL,
    qtype VARCHAR(10) DEFAULT NULL,
    def VARCHAR(5) DEFAULT NULL,
    PRIMARY KEY (subCode)
);

CREATE TABLE theoryscore1 (
    rollno VARCHAR(12) NOT NULL,
    facID VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    sem INT NOT NULL,
    batch INT NOT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    q9 INT DEFAULT NULL,
    q10 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    PRIMARY KEY (rollno, facID, subcode, sem, batch)
);

CREATE TABLE theoryscore2 (
    rollno VARCHAR(12) NOT NULL,
    facID VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    sem INT NOT NULL,
    batch INT NOT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    q9 INT DEFAULT NULL,
    q10 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    PRIMARY KEY (rollno, facID, subcode, sem, batch)
);

CREATE TABLE timetable (
    facID VARCHAR(15) NOT NULL,
    subCode VARCHAR(25) NOT NULL,
    sem INT NOT NULL,
    sec VARCHAR(5) NOT NULL,
    batch INT NOT NULL,
    branch VARCHAR(10) NOT NULL,
    PRIMARY KEY (facID, subCode, sem, sec, branch, batch)
);

CREATE TABLE users (
    userName VARCHAR(255) NOT NULL,
    password VARCHAR(255) DEFAULT NULL,
    displayName VARCHAR(255) NOT NULL,
    desg VARCHAR(10) DEFAULT NULL,
    branch VARCHAR(10) NOT NULL,
    PRIMARY KEY (userName, displayName, branch)
);

CREATE TABLE cf1 (
    rollno VARCHAR(15) NOT NULL,
    branch VARCHAR(10) NOT NULL,
    batch INT NOT NULL,
    sem INT NOT NULL,
    q0 INT DEFAULT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    q9 INT DEFAULT NULL,
    q10 INT DEFAULT NULL,
    q11 INT DEFAULT NULL,
    q12 INT DEFAULT NULL,
    q13 INT DEFAULT NULL,
    q14 INT DEFAULT NULL,
    q15 INT DEFAULT NULL,
    q16 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    PRIMARY KEY (rollno, branch, batch, sem)
);

CREATE TABLE cf2 (
    rollno VARCHAR(15) NOT NULL,
    branch VARCHAR(10) NOT NULL,
    batch INT NOT NULL,
    sem INT NOT NULL,
    q0 INT DEFAULT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    q9 INT DEFAULT NULL,
    q10 INT DEFAULT NULL,
    q11 INT DEFAULT NULL,
    q12 INT DEFAULT NULL,
    q13 INT DEFAULT NULL,
    q14 INT DEFAULT NULL,
    q15 INT DEFAULT NULL,
    q16 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    PRIMARY KEY (rollno, branch, batch, sem)
);

CREATE TABLE cfreport1 (
    branch VARCHAR(10) NOT NULL,
    batch INT NOT NULL,
    sem INT NOT NULL,
    percentile DECIMAL(10,4) DEFAULT NULL,
    PRIMARY KEY (branch, batch, sem)
);

CREATE TABLE cfreport2 (
    branch VARCHAR(10) NOT NULL,
    batch INT NOT NULL,
    sem INT NOT NULL,
    percentile DECIMAL(10,4) DEFAULT NULL,
    PRIMARY KEY (branch, batch, sem)
);

CREATE TABLE faculty (
    facID VARCHAR(15) NOT NULL,
    facName VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (facID)
);

CREATE TABLE labscore1 (
    rollno VARCHAR(12) NOT NULL,
    facID VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    sem INT NOT NULL,
    batch INT NOT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    PRIMARY KEY (rollno, facID, subcode, sem, batch)
);

CREATE TABLE labscore2 (
    rollno VARCHAR(12) NOT NULL,
    facID VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    sem INT NOT NULL,
    batch INT NOT NULL,
    q1 INT DEFAULT NULL,
    q2 INT DEFAULT NULL,
    q3 INT DEFAULT NULL,
    q4 INT DEFAULT NULL,
    q5 INT DEFAULT NULL,
    q6 INT DEFAULT NULL,
    q7 INT DEFAULT NULL,
    q8 INT DEFAULT NULL,
    score FLOAT DEFAULT NULL,
    PRIMARY KEY (rollno, facID, subcode, sem, batch)
);

CREATE TABLE questions (
    qtype VARCHAR(10) NOT NULL,
    question VARCHAR(500) NOT NULL,
    seq INT NOT NULL,
    PRIMARY KEY (qtype, seq)
);

CREATE TABLE report1 (
  facID varchar(15) NOT NULL,
  facName varchar(100) DEFAULT NULL,
  subcode varchar(50) NOT NULL,
  sec char(1) NOT NULL,
  sem int NOT NULL,
  percentile decimal(10,4) DEFAULT NULL,
  batch int NOT NULL,
  branch varchar(10) NOT NULL,
  completed int DEFAULT 0,
  total_students int DEFAULT 0,
  PRIMARY KEY (facID, subcode, sec, sem, batch, branch)
);

CREATE TABLE report2 (
  facID varchar(15) NOT NULL,
  facName varchar(100) DEFAULT NULL,
  subcode varchar(50) NOT NULL,
  sec char(1) NOT NULL,
  sem int NOT NULL,
  percentile decimal(10,4) DEFAULT NULL,
  batch int NOT NULL,
  branch varchar(10) NOT NULL,
  completed int DEFAULT 0,
  total_students int DEFAULT 0,
  PRIMARY KEY (facID, subcode, sec, sem, batch, branch)
);

CREATE TABLE electives (
    rollno  VARCHAR(15) NOT NULL,
    facID   VARCHAR(15) NOT NULL,
    subcode VARCHAR(15) NOT NULL,
    PRIMARY KEY (rollno, subcode)
);

CREATE TABLE otp_verification (
    rollno VARCHAR(255) NOT NULL,
    otp INT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rollno) REFERENCES studentinfo(rollno)
);

CREATE TABLE term (
    branch VARCHAR(15) NOT NULL PRIMARY KEY,
    term ENUM('1', '2') NOT NULL,
    status ENUM('active', 'inactive') NOT NULL
);


INSERT INTO users VALUES ("admin", "89110ab33e4f960f498d1ebe8318d459", "AD", "admin", '');


INSERT INTO term (branch, term, status)
SELECT DISTINCT branch, '1', 'inactive' FROM users
WHERE userName != 'admin';


INSERT INTO questions (qtype, question, seq)
VALUES
('ctype', 'Employability Skills', 0),
('ctype', 'Mentoring support', 1),
('theory', 'Passion and enthusiasm to teach', 1),
('lab', 'The lab instructor explained objectives and outcomes of lab experiments clearly well before the commencement of the lab', 1),
('ctype', 'Campus Placement Efforts', 2),
('lab', 'The lab instructor explained the procedures involved to perform the lab experiments/algorithms clearly well before the commencement of the lab', 2),
('theory', 'Subject knowledge', 2),
('ctype', 'Career and academic guidance', 3),
('lab', 'The laboratory assignments/discussion questions given after the completion of the experiment are interesting and reinforce what I have learned in the lab and its corresponding theoretical concepts', 3),
('theory', 'Clarity and emphasis on concepts', 3),
('ctype', 'Leadership of the college', 4),
('lab', 'The lab instructor is impartial in dealing with all students and was regularly available for consultation during the lab', 4),
('theory', 'Motivate the student to explore the concepts in depth on his/her own', 4),
('ctype', 'Soft skills and Personality Development', 5),
('lab', 'The lab instructor evaluated my work promptly, provided helpful feedback on my progress and offered specific advice to promote improvement', 5),
('theory', 'Creating interest in the subject', 5),
('ctype', 'Library Facilities', 6),
('lab', 'The lab instructor encourages me to work better with others in the lab', 6),
('theory', 'Quality of illustrative visuals, examples and applications', 6),
('ctype', 'Extracurricular activities', 7),
('lab', 'The lab instructor helps me learn important techniques associated with this lab course', 7),
('theory', 'Regularity, punctuality & uniform coverage of syllabus', 7),
('ctype', 'Co-curricular activities', 8),
('lab', 'Experiments/Algorithms detailed in the lab course have enhanced my critical thinking ability', 8),
('theory', 'Discipline and control over the class', 8),
('ctype', 'If using college transport, college transport facilities', 9),
('theory', 'Promoting student thinking', 9),
('ctype', 'Service in Academic Section', 10),
('theory', 'Encouraging student effort & inviting student interaction', 10),
('ctype', 'Service in Exam Branch', 11),
('ctype', 'Service in Accounts Section', 12),
('ctype', 'Physical Education Facilities', 13),
('ctype', 'Quality of food in Canteen', 14),
('ctype', 'Service in the Canteen', 15),
('ctype', 'Overall opinion of GCET in comparison to other colleges', 16);
