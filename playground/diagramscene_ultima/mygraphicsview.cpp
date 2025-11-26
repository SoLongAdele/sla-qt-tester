#include "mygraphicsview.h"
#include "mainwindow.h"

MyGraphicsView::MyGraphicsView(QWidget *parent) : QGraphicsView(parent)
{
    pAction = new QAction(this);  // Initialize QAction
}

void MyGraphicsView::contextMenuEvent(QContextMenuEvent *event)
{
    QMenu menu;
    pAction = menu.addAction(tr("Paste"));

    QAction *selectedAction = menu.exec(event->globalPos());
    if (selectedAction == pAction) {
        // Convert event position to scene coordinates
        QPointF scenePos = mapToScene(event->pos());
        static_cast<MainWindow*>(parent())->pasteItems(scenePos);
    }
}
